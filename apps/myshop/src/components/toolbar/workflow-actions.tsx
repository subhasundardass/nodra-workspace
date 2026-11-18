import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

import type { WorkflowTransition } from "./toolbar-types";

type WorkflowActionsProps = {
  transitions?: WorkflowTransition[];
};

export default function WorkflowActions({
  transitions = [],
}: WorkflowActionsProps) {
  const [primary, ...others] = transitions;

  if (!primary) {
    return null;
  }

  const PrimaryIcon = primary.icon;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={primary.variant ?? "outline"}
        disabled={primary.disabled}
        onClick={primary.onClick}
      >
        {PrimaryIcon && <PrimaryIcon className="mr-2 size-4" />}
        {primary.label}
      </Button>

      {others.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More workflow actions"
            >
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {others.map((transition) => {
              const TransitionIcon = transition.icon;

              return (
                <DropdownMenuItem
                  key={transition.id}
                  disabled={transition.disabled}
                  onSelect={transition.onClick}
                >
                  {TransitionIcon && <TransitionIcon className="mr-2 size-4" />}
                  {transition.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
