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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LinkField } from "@/components/doctype/fields/link-field";

export interface BrandFormValues {
  title: string;
  factory: string;
  is_active: boolean;
  description: string;
}

interface BrandFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BrandFormValues) => Promise<void>;
  initialValues?: Partial<BrandFormValues> | null;
}

const defaultValues: BrandFormValues = {
  title: "",
  factory: "",
  is_active: true,
  description: "",
};

export default function BrandFormSheet({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
}: BrandFormSheetProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const isEditing = Boolean(initialValues);

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    } as BrandFormValues,

    onSubmit: async ({ value }) => {
      setSubmitting(true);

      try {
        await onSubmit({
          ...value,
          factory: value.factory || "",
        });
        onOpenChange(false);
      } finally {
        setSubmitting(false);
      }
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        ...defaultValues,
        ...initialValues,
      });
    }
  }, [open, initialValues, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Update Brand" : "Create Brand"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the brand details."
              : "Add a brand to use when recording tea lots."}
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
          <form.Field
            name="title"
            validators={{
              onChange: ({ value }) =>
                value.trim().length === 0
                  ? "Brand title is required"
                  : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter brand title"
                  maxLength={140}
                  required
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="factory">
            {(field) => (
              <div className="space-y-2">
                <Label>Factory</Label>
                <LinkField
                  value={String(field.state.value ?? "")}
                  onChange={(value) => field.handleChange(value)}
                  doctype="Factory"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Link this brand to its associated factory.
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="is_active">
            {(field) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <Label htmlFor={field.name} className="cursor-pointer">
                  Is Active
                </Label>
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter an optional description"
                  rows={4}
                />
              </div>
            )}
          </form.Field>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Update Brand"
                  : "Create Brand"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
