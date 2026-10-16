import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronRight,
  Columns3,
  FileText,
  List,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

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

const viewIcons: Record<ToolbarView, LucideIcon> = {
  list: List,
  form: FileText,
  kanban: Columns3,
  calendar: CalendarDays,
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
        className="h-8 gap-1.5 rounded-md px-3 font-semibold"
      >
        {Icon && <Icon className="size-3.5" />}
        {action.label}
      </Button>
    );
  }

  return (
    <header className="relative mb-4 overflow-hidden rounded-sm border bg-card shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      {/* Background layers (decorative) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Soft wash from the left accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent" />

        {/* Rounded tile pattern, fading toward the center */}
        <svg
          className="absolute inset-y-0 right-0 h-full w-1/2 text-primary [mask-image:linear-gradient(to_left,black_30%,transparent)]"
          fill="none"
        >
          <defs>
            <pattern
              id="toolbar-tiles"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="3"
                y="3"
                width="22"
                height="22"
                rx="6"
                fill="currentColor"
                fillOpacity="0.07"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#toolbar-tiles)" />
        </svg>

        {/* One soft glow to add depth */}
        <div className="absolute -right-10 -top-16 h-40 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>
      {/* Main bar: record identity on the left, controls on the right */}

      <div className="flex flex-col gap-3 border-l-[3px] border-l-primary px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-lg font-semibold leading-tight tracking-tight">
              {title}
            </h1>

            {documentStatus && (
              <Badge
                variant={getStatusVariant(documentStatus)}
                className="rounded-sm px-2 py-0 text-xs font-semibold"
              >
                {documentStatus}
              </Badge>
            )}
          </div>

          {description && (
            <p className="max-w-3xl  text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {views.length > 0 && onViewChange && (
            <>
              <div
                role="group"
                aria-label="Switch view"
                className="flex items-center rounded-md border bg-muted/60 p-0.5"
              >
                {views.map((item) => {
                  const Icon = viewIcons[item];
                  const active = view === item;

                  return (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-pressed={active}
                      onClick={() => onViewChange(item)}
                      className={
                        active
                          ? "h-7 gap-1.5 rounded-[5px] bg-background px-2.5  text-foreground shadow-sm hover:bg-background font-semibold"
                          : "h-7 gap-1.5 rounded-[5px] px-2.5 text-muted-foreground hover:bg-transparent hover:text-foreground font-semibold"
                      }
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {getViewLabel(item)}
                    </Button>
                  );
                })}
              </div>

              <Separator
                orientation="vertical"
                className="mx-0.5 hidden h-6 sm:block"
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
                  className="size-8 rounded-md font-semibold"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-44">
                {menuActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={action.disabled}
                      onSelect={action.onClick}
                      className="gap-2"
                    >
                      {Icon && <Icon className="size-3.5" />}
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
    </header>
  );
}
