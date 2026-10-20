import type { LucideIcon } from "lucide-react";

export type ToolbarView = "list" | "form" | "kanban" | "calendar";

export type ToolbarAction = {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
  hidden?: boolean;
  placement?: "primary" | "menu";
  onClick: () => void;
};

export type ToolbarBreadcrumb = {
  label: string;
  href?: string;
};

export type WorkflowTransition = {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "destructive";
  disabled?: boolean;
  onClick: () => void;
};

export type GlobalToolbarProps = {
  title: string;
  breadcrumbs?: ToolbarBreadcrumb[];
  view?: ToolbarView;
  views?: ToolbarView[];
  onViewChange?: (view: ToolbarView) => void;
  documentStatus?: string;
  actions?: ToolbarAction[];
  transitions?: WorkflowTransition[];
  description?: string;
};
