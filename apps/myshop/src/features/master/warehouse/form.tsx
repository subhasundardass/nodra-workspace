import * as React from "react";
import { useForm } from "@tanstack/react-form";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkField } from "@/components/doctype/fields/link-field";
import { Checkbox } from "@/components/ui/checkbox";

export interface WarehouseFormValues {
  warehouse_name: string;
  factory: string;
  is_active: boolean;
}

interface WarehouseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WarehouseFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export default function WarehouseFormSheet({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: WarehouseFormSheetProps) {
  const form = useForm({
    defaultValues: {
      warehouse_name: "",
      factory: "",
      is_active: true,
    } satisfies WarehouseFormValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      form.reset();
      onOpenChange(false);
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create Warehouse</SheetTitle>
          <SheetDescription>
            Add a warehouse for tea storage and stock management.
          </SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.Field name="warehouse_name">
              {(field) => (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={field.name}>Warehouse Name *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter warehouse name"
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="factory">
              {(field) => (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={field.name}>Factory</Label>
                  <LinkField
                    value={field.state.value}
                    onChange={field.handleChange}
                    doctype="Factory"
                  />
                </div>
              )}
            </form.Field>

            <div className="flex items-center gap-3">
              <input
                id="grade-is-active"
                name="is_active"
                type="checkbox"
                className="size-4 accent-primary"
                checked={is_active}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="grade-is-active">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
