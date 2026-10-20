import type { ToolbarView } from "./toolbar-types";

export function getViewLabel(view: ToolbarView): string {
  const labels: Record<ToolbarView, string> = {
    list: "List",
    form: "Form",
    kanban: "Kanban",
    calendar: "Calendar",
  };

  return labels[view];
}

export function getStatusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
    case "released":
      return "default";

    case "rejected":
    case "cancelled":
      return "destructive";

    case "draft":
      return "secondary";

    default:
      return "outline";
  }
}
