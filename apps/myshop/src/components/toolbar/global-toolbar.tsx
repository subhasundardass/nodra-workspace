import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import WorkflowActions from "./workflow-actions";
import type { WorkflowTransition } from "./toolbar-types";

import { Button } from "@/components/ui/button";

type ToolbarIcon = ComponentType<LucideProps>;

export type GlobalToolbarAction = {
  id: string;
  label: string;
  icon?: ToolbarIcon;
  variant?:
    "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  hidden?: boolean;
  onClick: () => void;
};

export type GlobalToolbarProps = {
  title: string;
  description?: string;
  documentStatus?: string;
  actions?: GlobalToolbarAction[];
  transitions?: WorkflowTransition[];
  onBack?: () => void;
};

export function GlobalToolbar({
  title,
  description,
  documentStatus,
  actions = [],
  transitions = [],
  onBack,
}: GlobalToolbarProps) {
  const visibleActions = actions.filter((action) => !action.hidden);

  return (
    <header className="flex w-full min-w-0 flex-col gap-4 border-none pb-2 sm:flex-row sm:items-center sm:justify-between bg-transparent">
      <div className="flex min-w-0 items-start gap-3">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label="Go back"
            className="mt-0.5 shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {title}
            </h1>

            {documentStatus && (
              <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {documentStatus}
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {visibleActions.length > 0 || transitions.length > 0 ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {visibleActions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.id}
                type="button"
                variant={action.variant ?? "outline"}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {Icon && <Icon className="mr-2 size-4" />}
                {action.label}
              </Button>
            );
          })}

          <WorkflowActions transitions={transitions} />
        </div>
      ) : null}
    </header>
  );
}

export default GlobalToolbar;
