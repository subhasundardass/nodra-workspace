/**
 * Nodra Framework - DocType Schema
 *
 * Defines the interfaces for DocType definitions, field definitions,
 * workflow definitions, and permission rules.
 * Provides parsing/validation and standard field injection.
 */

import { ValidationError } from "../errors";
import { isFieldType } from "./field-types";
import type { FieldType } from "./field-types";

// --- Types ---

/**
 * Naming rule for a DocType.
 *
 * - autoincrement — numeric sequence
 * - hash — random hash
 */
export type NamingRule = "hash" | "series" | "autoincrement" | "field";

const VALID_NAMING_RULES = new Set<string>([
  "autoincrement",
  "hash",
  "series",
  "field",
]);

/**
 * A single field (column) on a DocType.
 */
export interface FieldDefinition {
  /** Machine name; becomes the database column name. */
  fieldname: string;
  /** Field type; determines the PostgreSQL type and UI widget. */
  fieldtype: FieldType;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Whether the field is required (maps to NOT NULL). */
  reqd?: boolean;
  /** Whether values must be unique across rows. */
  unique?: boolean;
  /** Default value used at insert time. */
  default?: unknown;
  /** Maximum length for string-like fields. */
  max_length?: number;
  /** Select options (newline list) or Link target DocType. */
  options?: string | string[];
  /** Hide the field in the UI. */
  hidden?: boolean;
  /** Render the field as read-only. */
  read_only?: boolean;
  /** Show the field in list views. */
  in_list_view?: boolean;
  /** Include the field in standard filters. */
  in_standard_filter?: boolean;
  /** Create a database index on this field. */
  search_index?: boolean;
  /** Help text displayed below the field. */
  description?: string;
  /** Conditional visibility expression. */
  depends_on?: string;
  /** Decimal precision for numeric fields. */
  precision?: number;
}

/**
 * A role-level permission rule for a DocType.
 */
export interface PermissionRule {
  /** Role this rule applies to. */
  role: string;
  /** Allow reading documents. */
  read: boolean;
  /** Allow updating documents. */
  write: boolean;
  /** Allow creating documents. */
  create: boolean;
  /** Allow deleting documents. */
  delete: boolean;
  /** Allow submitting documents. */
  submit: boolean;
  /** Allow cancelling submitted documents. */
  cancel: boolean;
  /** Allow amending cancelled documents. */
  amend: boolean;
  /** Restrict to documents owned by the current user. */
  if_owner: boolean;
}

/**
 * Field-level permission rule.
 * Uses direct field list model (Plan A).
 */
export interface FieldPermissionRule {
  /** Role this rule applies to. */
  role: string;
  /** List of readable fields; ['*'] means all fields. */
  read: string[];
  /** List of writable fields; ['*'] means all fields. */
  write: string[];
  /** Optional condition expression gating the rule. */
  condition?: string;
}

/**
 * A state in a DocType workflow.
 */
export interface DocTypeWorkflowState {
  state: string;
  doc_status?: number;
  is_initial?: boolean;
  is_final?: boolean;
  color?: string;
}

/**
 * A permitted transition between workflow states.
 *
 * Public DocType metadata uses from/to/roles.
 * The workflow engine can normalize these to its internal names.
 */
export interface DocTypeWorkflowTransition {
  from: string;
  action: string;
  to: string;
  roles?: string[];
}

/**
 * Workflow configuration embedded in DocType metadata.
 */
export interface DocTypeWorkflow {
  /** DocType field that stores the current workflow state. */
  state_field: string;
  states: DocTypeWorkflowState[];
  transitions: DocTypeWorkflowTransition[];
}

/**
 * Full definition of a DocType (the framework's equivalent of a model).
 */
export interface DocTypeDefinition {
  /** Unique DocType name; becomes the table name via toTableName. */
  name: string;
  /** Owning module (for organisation and metadata). */
  module: string;
  /** Strategy used to generate document names. */
  naming_rule: NamingRule;
  /** Naming pattern used when naming_rule is "series". */
  naming_series?: string;
  /** Naming used when naming_rule is "field". */
  naming_field?: string;
  /** Whether documents can be submitted/cancelled. */
  is_submittable: boolean;
  /** Whether this is a child table (embedded in a parent). */
  is_child: boolean;
  /** Whether this DocType holds a single global document. */
  is_single: boolean;
  /** Whether documents form a tree (nested set / parent-child). */
  is_tree: boolean;
  /** Whether this DocType has no physical table. */
  is_virtual: boolean;
  /** Field definitions. */
  fields: FieldDefinition[];
  /** Role-level permission rules. */
  permissions: PermissionRule[];
  /** Optional field-level permission rules. */
  field_permissions?: FieldPermissionRule[];
  /** Fields that participate in full-text search. */
  search_fields?: string[];
  /** Field used as the display title of a document. */
  title_field?: string;
  /** Default sort field for lists. */
  sort_field?: string;
  /** Default sort direction for lists. */
  sort_order?: "asc" | "desc";
  /** Optional lifecycle hooks (before_insert, after_save, etc.). */
  hooks?: Record<string, unknown>;
  /** Optional workflow configuration for this DocType. */
  workflow?: DocTypeWorkflow;
}

// --- Standard Fields ---

/**
 * Columns injected into every DocType's physical table.
 */
export const STANDARD_FIELDS: FieldDefinition[] = [
  { fieldname: "name", fieldtype: "Data", label: "Name" },
  { fieldname: "owner", fieldtype: "Data", label: "Owner" },
  {
    fieldname: "creation",
    fieldtype: "Datetime",
    label: "Created On",
  },
  {
    fieldname: "modified",
    fieldtype: "Datetime",
    label: "Last Modified",
  },
  {
    fieldname: "modified_by",
    fieldtype: "Data",
    label: "Modified By",
  },
  {
    fieldname: "docstatus",
    fieldtype: "Int",
    label: "Document Status",
  },
  { fieldname: "idx", fieldtype: "Int", label: "Index" },
];

/**
 * Columns injected into every child DocType's physical table.
 */
export const CHILD_TABLE_FIELDS: FieldDefinition[] = [
  { fieldname: "parent", fieldtype: "Data", label: "Parent" },
  { fieldname: "parenttype", fieldtype: "Data", label: "Parent Type" },
  { fieldname: "parentfield", fieldtype: "Data", label: "Parent Field" },
];

// --- Parsing Helpers ---

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateField(raw: unknown, index: number): FieldDefinition {
  if (!isPlainObject(raw)) {
    throw new ValidationError(`Field at index ${index} must be an object`);
  }

  const { fieldname, fieldtype, label } = raw;

  if (typeof fieldname !== "string" || fieldname.trim() === "") {
    throw new ValidationError(
      `Field at index ${index}: "fieldname" is required and must be a non-empty string`,
    );
  }

  if (typeof fieldtype !== "string" || !isFieldType(fieldtype)) {
    throw new ValidationError(
      `Field "${fieldname || index}": invalid fieldtype "${String(fieldtype)}"`,
    );
  }

  if (typeof label !== "string" || label.trim() === "") {
    throw new ValidationError(
      `Field "${fieldname}": "label" is required and must be a non-empty string`,
    );
  }

  return {
    fieldname,
    fieldtype,
    label,
    ...(raw["reqd"] !== undefined && { reqd: Boolean(raw["reqd"]) }),
    ...(raw["unique"] !== undefined && { unique: Boolean(raw["unique"]) }),
    ...(raw["default"] !== undefined && { default: raw["default"] }),
    ...(raw["max_length"] !== undefined && {
      max_length: Number(raw["max_length"]),
    }),
    ...(raw["options"] !== undefined && {
      options: raw["options"] as string | string[],
    }),
    ...(raw["hidden"] !== undefined && { hidden: Boolean(raw["hidden"]) }),
    ...(raw["read_only"] !== undefined && {
      read_only: Boolean(raw["read_only"]),
    }),
    ...(raw["in_list_view"] !== undefined && {
      in_list_view: Boolean(raw["in_list_view"]),
    }),
    ...(raw["in_standard_filter"] !== undefined && {
      in_standard_filter: Boolean(raw["in_standard_filter"]),
    }),
    ...(raw["search_index"] !== undefined && {
      search_index: Boolean(raw["search_index"]),
    }),
    ...(raw["description"] !== undefined && {
      description: String(raw["description"]),
    }),
    ...(raw["depends_on"] !== undefined && {
      depends_on: String(raw["depends_on"]),
    }),
    ...(raw["precision"] !== undefined && {
      precision: Number(raw["precision"]),
    }),
  };
}

/**
 * Parse and validate workflow metadata embedded in a DocType.
 */

function parseWorkflow(
  raw: unknown,
  doctypeName: string,
  fields: FieldDefinition[],
): DocTypeWorkflow {
  if (!isPlainObject(raw)) {
    throw new ValidationError(
      `DocType "${doctypeName}": "workflow" must be an object`,
    );
  }

  // Validate the field used to store the current workflow state.
  const stateField = raw["state_field"];

  if (typeof stateField !== "string" || stateField.trim() === "") {
    throw new ValidationError(
      `DocType "${doctypeName}": workflow.state_field is required`,
    );
  }

  const stateFieldDefinition = fields.find(
    (field) => field.fieldname === stateField,
  );

  if (!stateFieldDefinition) {
    throw new ValidationError(
      `DocType "${doctypeName}": workflow.state_field "${stateField}" does not exist`,
    );
  }

  if (
    stateFieldDefinition.fieldtype !== "Select" &&
    stateFieldDefinition.fieldtype !== "Data"
  ) {
    throw new ValidationError(
      `DocType "${doctypeName}": workflow.state_field "${stateField}" must use the Select or Data field type`,
    );
  }

  const rawStates = raw["states"];
  const rawTransitions = raw["transitions"];

  if (!Array.isArray(rawStates) || rawStates.length === 0) {
    throw new ValidationError(
      `DocType "${doctypeName}": workflow.states must be a non-empty array`,
    );
  }

  if (!Array.isArray(rawTransitions)) {
    throw new ValidationError(
      `DocType "${doctypeName}": workflow.transitions must be an array`,
    );
  }

  const states: DocTypeWorkflowState[] = rawStates.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new ValidationError(
        `DocType "${doctypeName}": workflow state at index ${index} must be an object`,
      );
    }

    const state = item["state"];
    const docStatus = item["doc_status"];
    const isInitial = item["is_initial"];
    const isFinal = item["is_final"];
    const color = item["color"];

    if (typeof state !== "string" || state.trim() === "") {
      throw new ValidationError(
        `DocType "${doctypeName}": workflow state at index ${index} requires a non-empty state name`,
      );
    }

    if (
      typeof docStatus !== "number" ||
      !Number.isSafeInteger(docStatus) ||
      docStatus < 0
    ) {
      throw new ValidationError(
        `DocType "${doctypeName}": workflow state "${state}" must define doc_status as a non-negative safe integer`,
      );
    }

    if (
      docStatus !== undefined &&
      (typeof docStatus !== "number" ||
        !Number.isSafeInteger(docStatus) ||
        docStatus < 0)
    ) {
      throw new ValidationError(
        `DocType "${doctypeName}": doc_status for workflow state "${state}" must be a non-negative safe integer`,
      );
    }

    if (isInitial !== undefined && typeof isInitial !== "boolean") {
      throw new ValidationError(
        `DocType "${doctypeName}": is_initial for state "${state}" must be a boolean`,
      );
    }

    if (isFinal !== undefined && typeof isFinal !== "boolean") {
      throw new ValidationError(
        `DocType "${doctypeName}": is_final for state "${state}" must be a boolean`,
      );
    }

    if (color !== undefined && typeof color !== "string") {
      throw new ValidationError(
        `DocType "${doctypeName}": color for state "${state}" must be a string`,
      );
    }

    return {
      state,
      ...(docStatus !== undefined && { doc_status: docStatus }),
      ...(isInitial !== undefined && { is_initial: isInitial }),
      ...(isFinal !== undefined && { is_final: isFinal }),
      ...(color !== undefined && { color }),
    };
  });

  const stateNames = new Set(states.map((state) => state.state));

  if (stateNames.size !== states.length) {
    throw new ValidationError(
      `DocType "${doctypeName}": workflow state names must be unique`,
    );
  }

  const initialStates = states.filter((state) => state.is_initial === true);

  if (initialStates.length !== 1) {
    throw new ValidationError(
      `DocType "${doctypeName}": workflow must have exactly one initial state`,
    );
  }

  const transitions: DocTypeWorkflowTransition[] = rawTransitions.map(
    (item, index) => {
      if (!isPlainObject(item)) {
        throw new ValidationError(
          `DocType "${doctypeName}": workflow transition at index ${index} must be an object`,
        );
      }

      const from = item["from"];
      const action = item["action"];
      const to = item["to"];
      const roles = item["roles"];

      if (
        typeof from !== "string" ||
        from.trim() === "" ||
        typeof action !== "string" ||
        action.trim() === "" ||
        typeof to !== "string" ||
        to.trim() === ""
      ) {
        throw new ValidationError(
          `DocType "${doctypeName}": workflow transition at index ${index} requires non-empty from, action, and to values`,
        );
      }

      if (!stateNames.has(from) || !stateNames.has(to)) {
        throw new ValidationError(
          `DocType "${doctypeName}": transition "${action}" references an unknown state`,
        );
      }

      if (
        roles !== undefined &&
        (!Array.isArray(roles) ||
          !roles.every(
            (role): role is string =>
              typeof role === "string" && role.trim() !== "",
          ))
      ) {
        throw new ValidationError(
          `DocType "${doctypeName}": roles for transition "${action}" must be an array of non-empty strings`,
        );
      }

      return {
        from,
        action,
        to,
        ...(roles !== undefined && { roles: [...roles] }),
      };
    },
  );

  return {
    state_field: stateField,
    states,
    transitions,
  };
}

// --- DocType Parsing ---

/**
 * Parse and validate a raw DocType definition.
 *
 * Workflow metadata is optional. When provided, it must contain a non-empty
 * states array, exactly one initial state, and valid transition references.
 *
 * @param raw - Untrusted value, typically a parsed JSON object.
 * @returns A validated DocTypeDefinition.
 * @throws ValidationError if required DocType properties or workflow metadata
 * are invalid.
 */
export function parseDocType(raw: unknown): DocTypeDefinition {
  if (!isPlainObject(raw)) {
    throw new ValidationError("DocType definition must be a plain object");
  }

  const { name, module } = raw;

  if (typeof name !== "string" || name.trim() === "") {
    throw new ValidationError(
      '"name" is required and must be a non-empty string',
    );
  }

  if (typeof module !== "string" || module.trim() === "") {
    throw new ValidationError(
      `DocType "${name}": "module" is required and must be a non-empty string`,
    );
  }

  const rawFields = raw["fields"];

  if (!Array.isArray(rawFields)) {
    throw new ValidationError(
      `DocType "${name}": "fields" is required and must be an array`,
    );
  }

  if (rawFields.length === 0) {
    throw new ValidationError(
      `DocType "${name}": "fields" must contain at least one field`,
    );
  }

  const namingRule = raw["naming_rule"] ?? "autoincrement";

  if (typeof namingRule !== "string" || !VALID_NAMING_RULES.has(namingRule)) {
    throw new ValidationError(
      `DocType "${name}": invalid naming_rule "${String(namingRule)}"`,
    );
  }

  const fields = rawFields.map((field, index) => validateField(field, index));

  const namingSeries = raw["naming_series"];

  if (namingRule === "series") {
    if (
      typeof namingSeries !== "string" ||
      namingSeries.trim() === "" ||
      !namingSeries.includes("#")
    ) {
      throw new ValidationError(
        `DocType "${name}": naming_series is required for series naming`,
      );
    }
  }

  // Parse permissions.
  const rawPermissions = raw["permissions"];

  const permissions: PermissionRule[] = Array.isArray(rawPermissions)
    ? rawPermissions.map((item, index) => {
        if (!isPlainObject(item)) {
          throw new ValidationError(
            `DocType "${name}": permission at index ${index} must be an object`,
          );
        }

        if (typeof item["role"] !== "string" || item["role"].trim() === "") {
          throw new ValidationError(
            `DocType "${name}": permission at index ${index} requires a role`,
          );
        }

        return {
          role: item["role"],
          read: Boolean(item["read"]),
          write: Boolean(item["write"]),
          create: Boolean(item["create"]),
          delete: Boolean(item["delete"]),
          submit: Boolean(item["submit"]),
          cancel: Boolean(item["cancel"]),
          amend: Boolean(item["amend"]),
          if_owner: Boolean(item["if_owner"]),
        };
      })
    : [];

  // Parse field_permissions.
  const rawFieldPermissions = raw["field_permissions"];

  const fieldPermissions: FieldPermissionRule[] = Array.isArray(
    rawFieldPermissions,
  )
    ? rawFieldPermissions.map((item, index) => {
        if (!isPlainObject(item)) {
          throw new ValidationError(
            `DocType "${name}": field permission at index ${index} must be an object`,
          );
        }

        const role = item["role"];
        const read = item["read"];
        const write = item["write"];
        const condition = item["condition"];

        if (typeof role !== "string" || role.trim() === "") {
          throw new ValidationError(
            `DocType "${name}": field permission at index ${index} requires a role`,
          );
        }

        const parseFieldList = (value: unknown, property: string): string[] => {
          if (value === "*") {
            return ["*"];
          }

          if (
            Array.isArray(value) &&
            value.every((field): field is string => typeof field === "string")
          ) {
            return [...value];
          }

          if (value === undefined) {
            return [];
          }

          throw new ValidationError(
            `DocType "${name}": field permission "${property}" must be an array of strings or "*"`,
          );
        };

        if (condition !== undefined && typeof condition !== "string") {
          throw new ValidationError(
            `DocType "${name}": field permission condition must be a string`,
          );
        }

        return {
          role,
          read: parseFieldList(read, "read"),
          write: parseFieldList(write, "write"),
          ...(condition !== undefined && { condition }),
        };
      })
    : [];

  // Workflow is optional; only parse it when explicitly provided.
  const workflow =
    raw["workflow"] === undefined
      ? undefined
      : parseWorkflow(raw["workflow"], name, fields);

  const searchFields = raw["search_fields"];
  if (
    searchFields !== undefined &&
    (!Array.isArray(searchFields) ||
      !searchFields.every(
        (field): field is string => typeof field === "string",
      ))
  ) {
    throw new ValidationError(
      `DocType "${name}": search_fields must be an array of strings`,
    );
  }

  const sortOrder = raw["sort_order"];
  if (sortOrder !== undefined && sortOrder !== "asc" && sortOrder !== "desc") {
    throw new ValidationError(
      `DocType "${name}": sort_order must be "asc" or "desc"`,
    );
  }

  const hooks = raw["hooks"];
  if (hooks !== undefined && !isPlainObject(hooks)) {
    throw new ValidationError(`DocType "${name}": hooks must be an object`);
  }

  return {
    name,
    module,
    naming_rule: namingRule as NamingRule,

    ...(typeof raw["naming_field"] === "string" && {
      naming_field: raw["naming_field"],
    }),
    ...(typeof raw["naming_series"] === "string" && {
      naming_series: raw["naming_series"],
    }),

    is_submittable: Boolean(raw["is_submittable"]),
    is_child: Boolean(raw["is_child"]),
    is_single: Boolean(raw["is_single"]),
    is_tree: Boolean(raw["is_tree"]),
    is_virtual: Boolean(raw["is_virtual"]),
    fields,
    permissions,
    ...(fieldPermissions.length > 0 && {
      field_permissions: fieldPermissions,
    }),
    ...(searchFields !== undefined && {
      search_fields: [...searchFields],
    }),
    ...(raw["title_field"] !== undefined && {
      title_field: String(raw["title_field"]),
    }),
    ...(raw["sort_field"] !== undefined && {
      sort_field: String(raw["sort_field"]),
    }),
    ...(sortOrder !== undefined && { sort_order: sortOrder }),
    ...(hooks !== undefined && { hooks }),
    ...(workflow !== undefined && { workflow }),
  };
}

// --- Standard Field Injection ---

/**
 * Return a copy of a DocType with standard fields and, for child DocTypes,
 * child-table fields prepended. Existing field names are not duplicated.
 *
 * @param doctype - The DocType definition to augment.
 * @returns A new DocTypeDefinition; the input is not mutated.
 */
export function injectStandardFields(
  doctype: DocTypeDefinition,
): DocTypeDefinition {
  const existingFieldnames = new Set(
    doctype.fields.map((field) => field.fieldname),
  );

  const standardToInject = STANDARD_FIELDS.filter(
    (field) => !existingFieldnames.has(field.fieldname),
  );

  const childToInject = doctype.is_child
    ? CHILD_TABLE_FIELDS.filter(
        (field) => !existingFieldnames.has(field.fieldname),
      )
    : [];

  return {
    ...doctype,
    fields: [...standardToInject, ...childToInject, ...doctype.fields],
  };
}
