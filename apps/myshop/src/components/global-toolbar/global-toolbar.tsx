import { Link } from "@tanstack/react-router";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import WorkflowActions from "./workflow-actions";
import { getStatusVariant, getViewLabel } from "./toolbar-actions";
import type {
  GlobalToolbarProps,
  ToolbarAction,
  ToolbarView,
} from "./toolbar-types";

const viewIcons: Record<ToolbarView, string> = {
  list: "☷",
  form: "▤",
  kanban: "▦",
  calendar: "▦",
};

export default function GlobalToolbar({
  title,
  breadcrumbs = [],
  view,
  views = [],
  onViewChange,
  documentStatus,
  actions = [],
  transitions = [],
  description,
}: GlobalToolbarProps) {
  const visibleActions = actions.filter((action) => !action.hidden);
  const primaryActions = visibleActions.filter(
    (action) => action.placement !== "menu",
  );
  const menuActions = visibleActions.filter(
    (action) => action.placement === "menu",
  );

  function renderAction(action: ToolbarAction) {
    const Icon = action.icon;

    return (
      <Button
        key={action.id}
        type="button"
        variant={action.variant ?? "outline"}
        disabled={action.disabled}
        onClick={action.onClick}
        size="sm"
      >
        {Icon && <Icon className="mr-2 size-4" />}
        {action.label}
      </Button>
    );
  }

  return (
    <div className="mb-2 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

            {documentStatus && (
              <Badge variant={getStatusVariant(documentStatus)}>
                {documentStatus}
              </Badge>
            )}
          </div>

          {description && (
            <p className="mt-0 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {views.length > 0 && onViewChange && (
            <>
              <div className="flex items-center rounded-md border p-1">
                {views.map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={view === item ? "secondary" : "ghost"}
                    aria-pressed={view === item}
                    onClick={() => onViewChange(item)}
                  >
                    <span className="mr-1.5" aria-hidden="true">
                      {viewIcons[item]}
                    </span>
                    {getViewLabel(item)}
                  </Button>
                ))}
              </div>

              <Separator
                orientation="vertical"
                className="hidden h-7 sm:block"
              />
            </>
          )}

          {primaryActions.map(renderAction)}

          {menuActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {menuActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={action.disabled}
                      onSelect={action.onClick}
                    >
                      {Icon && <Icon className="mr-2 size-4" />}
                      {action.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <WorkflowActions transitions={transitions} />
        </div>
      </div>
    </div>
  );
}
