import type { ViewDefinition, ViewType } from "./schema.js";

/**
 * Creates the initial framework default view.
 *
 * The actual automatic field/layout generation will be implemented
 * later using DocType metadata.
 */
export function createDefaultView(
  doctype: string,
  type: ViewType,
): ViewDefinition {
  return {
    name: `${doctype} ${capitalize(type)}`,
    doctype,
    type,
    default: true,
  };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
