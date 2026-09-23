import type { DocTypeDefinition, FieldDefinition } from "../doctype/schema.js";
import type { ViewDefinition, ViewType } from "./schema.js";

/**
 * Create a default view directly from DocType metadata.
 */
export function createDefaultView(
  doctype: DocTypeDefinition,
  type: ViewType,
): ViewDefinition {
  const fields = getVisibleFields(doctype.fields);

  switch (type) {
    case "list":
      return {
        name: `${doctype.name} List`,
        doctype: doctype.name,
        module: doctype.module,
        type: "list",
        default: true,
        config: {
          fields: getFieldsForView(doctype, "list", fields),
          sort: {
            field: doctype.sort_field ?? "modified",
            order: doctype.sort_order ?? "desc",
          },
        },
      };

    case "form":
      return {
        name: `${doctype.name} Form`,
        doctype: doctype.name,
        module: doctype.module,
        type: "form",
        default: true,
        config: {
          fields: fields.map((field) => field.fieldname),
        },
      };

    case "detail":
      return {
        name: `${doctype.name} Detail`,
        doctype: doctype.name,
        module: doctype.module,
        type: "detail",
        default: true,
        config: {
          fields: fields.map((field) => field.fieldname),
        },
      };

    case "search":
      return {
        name: `${doctype.name} Search`,
        doctype: doctype.name,
        module: doctype.module,
        type: "search",
        default: true,
        config: {
          fields: fields.map((field) => field.fieldname),
          search_fields: doctype.search_fields ?? getSearchFields(fields),
        },
      };

    case "kanban":
      return {
        name: `${doctype.name} Kanban`,
        doctype: doctype.name,
        module: doctype.module,
        type: "kanban",
        default: true,
        config: {
          title_field: doctype.title_field ?? "name",
        },
      };

    default:
      throw new Error(
        `Default view generation for "${type}" is not implemented`,
      );
  }
}

function getVisibleFields(fields: FieldDefinition[]): FieldDefinition[] {
  return fields.filter((field) => !field.hidden);
}

function getFieldsForView(
  doctype: DocTypeDefinition,
  type: ViewType,
  fields: FieldDefinition[],
): string[] {
  switch (type) {
    case "list": {
      const listFields = fields.filter((field) => field.in_list_view);

      if (listFields.length > 0) {
        return listFields.map((field) => field.fieldname);
      }

      return fields.slice(0, 5).map((field) => field.fieldname);
    }

    case "search":
      return doctype.search_fields ?? getSearchFields(fields);

    case "form":
    case "detail":
      return fields.map((field) => field.fieldname);

    default:
      return fields.map((field) => field.fieldname);
  }
}

function getSearchFields(fields: FieldDefinition[]): string[] {
  return fields
    .filter((field) => ["Data", "Text", "Link"].includes(field.fieldtype))
    .slice(0, 5)
    .map((field) => field.fieldname);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
