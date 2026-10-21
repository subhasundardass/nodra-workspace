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

export interface FactoryFormValues {
  factory_name: string;
  address: string;
  phone: string;
  email: string;
}

interface FactoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FactoryFormValues) => Promise<void>;
}

const defaultValues: FactoryFormValues = {
  factory_name: "",
  address: "",
  phone: "",
  email: "",
};

export default function FactoryFormSheet({
  open,
  onOpenChange,
  onSubmit,
}: FactoryFormSheetProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setSubmitting(true);

      try {
        await onSubmit(value);
        form.reset();
      } finally {
        setSubmitting(false);
      }
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create Factory</SheetTitle>
          <SheetDescription>
            Add a factory to use when recording tea lots.
          </SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field
            name="factory_name"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Factory name is required",
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Factory Name *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter factory name"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="address">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Address</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter factory address"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Phone</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            )}
          </form.Field>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Factory"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
