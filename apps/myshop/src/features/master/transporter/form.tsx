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

export interface TransporterFormValues {
  title: string;
  phone: string;
  contact_person: string;
  address: string;
}

interface TransporterFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TransporterFormValues) => Promise<void>;
}

const defaultValues: TransporterFormValues = {
  title: "",
  phone: "",
  contact_person: "",
  address: "",
};

export default function TransporterFormSheet({
  open,
  onOpenChange,
  onSubmit,
}: TransporterFormSheetProps) {
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
          <SheetTitle>Create Transporter</SheetTitle>
          <SheetDescription>
            Add a transporter for tea dispatch.
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
            name="title"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Transporter name is required",
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Transporter Name *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter transporter name"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
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

          <form.Field name="contact_person">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Contact Person</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter contact person"
                />
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
                  placeholder="Enter transporter address"
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
              {submitting ? "Creating..." : "Create Transporter"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
