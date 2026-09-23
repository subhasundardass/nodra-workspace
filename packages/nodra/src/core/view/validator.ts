import { ValidationError } from "../errors.js";
import type { DocTypeDefinition } from "../doctype/schema.js";
import type { ViewDefinition } from "./schema.js";

export function validateView(
  view: ViewDefinition,
  doctype: DocTypeDefinition,
): void {
  if (view.doctype !== doctype.name) {
    throw new ValidationError(
      `View "${view.name}" belongs to "${view.doctype}", not "${doctype.name}"`,
    );
  }

  const fieldnames = new Set(doctype.fields.map((field) => field.fieldname));

  switch (view.type) {
    case "list":
      validateFields(view.config.fields, fieldnames, `View "${view.name}"`);

      if (view.config.sort) {
        validateField(
          view.config.sort.field,
          fieldnames,
          `View "${view.name}" sort`,
        );
      }

      break;

    case "form":
      validateFields(view.config.fields, fieldnames, `View "${view.name}"`);

      if (view.config.sections) {
        for (const section of view.config.sections) {
          validateFields(
            section.fields,
            fieldnames,
            `View "${view.name}" section`,
          );
        }
      }

      break;

    case "detail":
      validateFields(view.config.fields, fieldnames, `View "${view.name}"`);

      break;

    case "search":
      validateFields(view.config.fields, fieldnames, `View "${view.name}"`);

      validateFields(
        view.config.search_fields,
        fieldnames,
        `View "${view.name}" search`,
      );

      break;

    case "kanban":
      validateField(
        view.config.title_field,
        fieldnames,
        `View "${view.name}" title`,
      );

      if (view.config.group_by) {
        validateField(
          view.config.group_by,
          fieldnames,
          `View "${view.name}" group_by`,
        );
      }

      break;
  }
}

function validateFields(
  fields: string[],
  fieldnames: Set<string>,
  context: string,
): void {
  const duplicates = new Set<string>();

  for (const fieldname of fields) {
    if (duplicates.has(fieldname)) {
      throw new ValidationError(`${context}: duplicate field "${fieldname}"`);
    }

    duplicates.add(fieldname);

    validateField(fieldname, fieldnames, context);
  }
}

function validateField(
  fieldname: string,
  fieldnames: Set<string>,
  context: string,
): void {
  if (!fieldnames.has(fieldname)) {
    throw new ValidationError(
      `${context}: field "${fieldname}" does not exist`,
    );
  }
}
