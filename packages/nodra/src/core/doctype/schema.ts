/**
 * Nodra Framework - DocType Schema
 *
 * Defines the interfaces for DocType definitions, field definitions,
 * and permission rules. Provides parsing/validation and standard field injection.
 */

import { ValidationError } from "../errors.js";
import { isFieldType } from "./field-types.js";
import type { FieldType } from "./field-types.js";

// --- Types ---

/**
 * Naming rule for a DocType.
 *
 * - `autoincrement` — numeric sequence
 * - `hash` — random hash
 * - `field` — value from a designated field
 * - `format` — pattern-based (e.g. `PREFIX-{#####}`)
 * - `prompt` — user-supplied at creation time
 * - `expression` — computed by an expression
 */
export type NamingRule =
  "autoincrement" | "hash" | "field" | "format" | "prompt" | "expression";

const VALID_NAMING_RULES = new Set<string>([
  "autoincrement",
  "hash",
  "field",
  "format",
  "prompt",
  "expression",
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
  /** Whether the field is required (maps to `NOT NULL`). */
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
  /** List of readable fields; `['*']` means all fields. */
  read: string[];
  /** List of writable fields; `['*']` means all fields. */
  write: string[];
  /** Optional condition expression gating the rule. */
  condition?: string;
}

/**
 * Full definition of a DocType (the framework's equivalent of a model).
 */
export interface DocTypeDefinition {
  /** Unique DocType name; becomes the table name via `toTableName`. */
  name: string;
  /** Owning module (for organisation and metadata). */
  module: string;
  /** Strategy used to generate document names. */
  naming_rule: NamingRule;
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

// --- Parsing ---

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateField(raw: unknown, index: number): FieldDefinition {
  if (!isPlainObject(raw)) {
    throw new ValidationError(`Field at index ${index} must be an object`);
  }

  const { fieldname, fieldtype, label } = raw;

  if (typeof fieldname !== "string" || fieldname === "") {
    throw new ValidationError(
      `Field at index ${index}: "fieldname" is required and must be a non-empty string`,
    );
  }
  if (typeof fieldtype !== "string" || !isFieldType(fieldtype)) {
    throw new ValidationError(
      `Field "${fieldname || index}": invalid fieldtype "${String(fieldtype)}"`,
    );
  }
  if (typeof label !== "string" || label === "") {
    throw new ValidationError(
      `Field "${fieldname}": "label" is required and must be a non-empty string`,
    );
  }

  return {
    fieldname,
    fieldtype,
    label,
    ...(raw["reqd"] !== undefined && {
      reqd: Boolean(raw["reqd"]),
    }),
    ...(raw["unique"] !== undefined && {
      unique: Boolean(raw["unique"]),
    }),
    ...(raw["default"] !== undefined && {
      default: raw["default"],
    }),
    ...(raw["max_length"] !== undefined && {
      max_length: Number(raw["max_length"]),
    }),
    ...(raw["options"] !== undefined && {
      options: raw["options"] as string | string[],
    }),
    ...(raw["hidden"] !== undefined && {
      hidden: Boolean(raw["hidden"]),
    }),
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
 * Parse and validate a raw DocType definition.
 *
 * @param raw - Untrusted value (typically a parsed TS/JSON object).
 * @returns A validated `DocTypeDefinition`.
 * @throws {ValidationError} If `name`, `module`, `fields`, `naming_rule`,
 *   or any field's `fieldname` / `fieldtype` / `label` is missing or invalid.
 *
 * @example
 * const doctype = parseDocType({
 *   name: 'Todo',
 *   module: 'Core',
 *   fields: [{ fieldname: 'title', fieldtype: 'Data', label: 'Title' }],
 * });
 */
export function parseDocType(raw: unknown): DocTypeDefinition {
  if (!isPlainObject(raw)) {
    throw new ValidationError("DocType definition must be a plain object");
  }

  // Validate required string fields
  const { name, module } = raw;
  if (typeof name !== "string" || name === "") {
    throw new ValidationError(
      '"name" is required and must be a non-empty string',
    );
  }
  if (typeof module !== "string" || module === "") {
    throw new ValidationError(
      `DocType "${name}": "module" is required and must be a non-empty string`,
    );
  }

  // Validate fields array
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

  // Validate naming_rule
  const namingRule = raw["naming_rule"] ?? "autoincrement";
  if (typeof namingRule !== "string" || !VALID_NAMING_RULES.has(namingRule)) {
    throw new ValidationError(
      `DocType "${name}": invalid naming_rule "${String(namingRule)}"`,
    );
  }

  // Parse fields
  const fields = rawFields.map((f, i) => validateField(f, i));

  // Parse permissions
  const rawPermissions = raw["permissions"];
  const permissions: PermissionRule[] = Array.isArray(rawPermissions)
    ? rawPermissions.map((p) => ({
        role: String((p as Record<string, unknown>)["role"]),
        read: Boolean((p as Record<string, unknown>)["read"]),
        write: Boolean((p as Record<string, unknown>)["write"]),
        create: Boolean((p as Record<string, unknown>)["create"]),
        delete: Boolean((p as Record<string, unknown>)["delete"]),
        submit: Boolean((p as Record<string, unknown>)["submit"]),
        cancel: Boolean((p as Record<string, unknown>)["cancel"]),
        amend: Boolean((p as Record<string, unknown>)["amend"]),
        if_owner: Boolean((p as Record<string, unknown>)["if_owner"]),
      }))
    : [];

  // Parse field_permissions
  const rawFieldPermissions = raw["field_permissions"];
  const fieldPermissions: FieldPermissionRule[] = Array.isArray(
    rawFieldPermissions,
  )
    ? rawFieldPermissions.map((p) => {
        const raw = p as Record<string, unknown>;
        const read = raw["read"];
        const write = raw["write"];
        return {
          role: String(raw["role"]),
          read: Array.isArray(read)
            ? (read as string[])
            : read === "*"
              ? ["*"]
              : [],
          write: Array.isArray(write)
            ? (write as string[])
            : write === "*"
              ? ["*"]
              : [],
          condition: raw["condition"] as string | undefined,
        };
      })
    : [];

  return {
    name,
    module,
    naming_rule: namingRule as NamingRule,
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
    ...(raw["search_fields"] !== undefined && {
      search_fields: raw["search_fields"] as string[],
    }),
    ...(raw["title_field"] !== undefined && {
      title_field: String(raw["title_field"]),
    }),
    ...(raw["sort_field"] !== undefined && {
      sort_field: String(raw["sort_field"]),
    }),
    ...(raw["sort_order"] !== undefined && {
      sort_order: raw["sort_order"] as "asc" | "desc",
    }),
    ...(raw["hooks"] !== undefined && {
      hooks: raw["hooks"] as Record<string, unknown>,
    }),
  };
}

// --- Standard Field Injection ---

/**
 * Return a copy of `doctype` with standard fields (and child-table fields,
 * when `is_child`) prepended to `doctype.fields`, skipping any fieldname
 * already present.
 *
 * @param doctype - The DocType definition to augment.
 * @returns A new `DocTypeDefinition`; the input is not mutated.
 *
 * @example
 * const withStd = injectStandardFields(parseDocType(raw));
 * // withStd.fields starts with name, owner, creation, modified, ...
 */
export function injectStandardFields(
  doctype: DocTypeDefinition,
): DocTypeDefinition {
  const existingFieldnames = new Set(doctype.fields.map((f) => f.fieldname));

  // Collect standard fields that are not already present
  const standardToInject = STANDARD_FIELDS.filter(
    (sf) => !existingFieldnames.has(sf.fieldname),
  );

  // For child DocTypes, also inject child table fields
  let childToInject: FieldDefinition[] = [];
  if (doctype.is_child) {
    childToInject = CHILD_TABLE_FIELDS.filter(
      (cf) => !existingFieldnames.has(cf.fieldname),
    );
  }

  return {
    ...doctype,
    fields: [...standardToInject, ...childToInject, ...doctype.fields],
  };
}
