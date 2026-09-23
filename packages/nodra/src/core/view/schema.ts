/**
 * View metadata definitions.
 *
 * Views describe how a DocType should be presented.
 * They are intentionally separate from DocType metadata.
 */

export type ViewType =
  | "list"
  | "form"
  | "detail"
  | "search"
  | "kanban"
  | "calendar"
  | "timeline"
  | "dashboard"
  | "report";

export interface ViewDefinition {
  /**
   * Unique view name.
   *
   * Example:
   *   "Member List"
   */
  name: string;

  /**
   * DocType this view belongs to.
   */
  doctype: string;

  /**
   * Type of view.
   */
  type: ViewType;

  /**
   * Optional application/module name.
   */
  module?: string;

  /**
   * Whether this is the default view for this type.
   */
  default?: boolean;

  /**
   * View-specific configuration.
   *
   * This will be strongly typed later as the View DSL evolves.
   */
  config?: Record<string, unknown>;
}
