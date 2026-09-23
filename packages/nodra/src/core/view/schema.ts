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

export interface ListViewConfig {
  fields: string[];
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  filters?: string[];
  page_size?: number;
}

export interface FormSection {
  label?: string;
  fields: string[];
  collapsible?: boolean;
}

export interface FormViewConfig {
  fields: string[];
  sections?: FormSection[];
}

export interface DetailViewConfig {
  fields: string[];
}

export interface SearchViewConfig {
  fields: string[];
  search_fields: string[];
}

export interface KanbanViewConfig {
  title_field: string;
  group_by?: string;
}

export interface ViewBase {
  name: string;
  doctype: string;
  module?: string;
  default?: boolean;
}

export type ViewDefinition =
  | (ViewBase & {
      type: "list";
      config: ListViewConfig;
    })
  | (ViewBase & {
      type: "form";
      config: FormViewConfig;
    })
  | (ViewBase & {
      type: "detail";
      config: DetailViewConfig;
    })
  | (ViewBase & {
      type: "search";
      config: SearchViewConfig;
    })
  | (ViewBase & {
      type: "kanban";
      config: KanbanViewConfig;
    });
