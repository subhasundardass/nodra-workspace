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
import { Checkbox } from "@/components/ui/checkbox";
import { LinkField } from "@/components/doctype/fields/link-field";

export interface WarehouseFormValues {
  title: string;
  factory: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_no: string;
  email: string;
  manager: string;
  capacity: number | undefined;
  is_active: boolean;
}

interface WarehouseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WarehouseFormValues) => Promise<void>;
}

const defaultValues: WarehouseFormValues = {
  title: "",
  factory: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  phone_no: "",
  email: "",
  manager: "",
  capacity: undefined,
  is_active: true,
};

export default function WarehouseFormSheet({
  open,
  onOpenChange,
  onSubmit,
}: WarehouseFormSheetProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const title = value.title.trim();

      if (!title) {
        return;
      }

      setSubmitting(true);

      try {
        await onSubmit({
          ...value,
          title,
          factory: value.factory || "",
          manager: value.manager || "",
          address: value.address.trim(),
          city: value.city.trim(),
          state: value.state.trim(),
          postal_code: value.postal_code.trim(),
          country: value.country.trim() || "India",
          phone_no: value.phone_no.trim(),
          email: value.email.trim(),
        });

        onOpenChange(false);
        form.reset();
      } finally {
        setSubmitting(false);
      }
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-2xl">
        <SheetHeader className="px-0">
          <SheetTitle>Create Warehouse</SheetTitle>
          <SheetDescription>
            Enter warehouse details, location, contact information, and storage
            capacity.
          </SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-6 pb-2"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            {/* Warehouse Name */}
            <form.Field
              name="title"
              validators={{
                onBlur: ({ value }) =>
                  value.trim().length === 0
                    ? "Warehouse name is required"
                    : undefined,
              }}
            >
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>
                    Warehouse Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter warehouse name"
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

            {/* Factory */}
            <form.Field name="factory">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="warehouse-factory">Factory</Label>
                  <LinkField
                    value={field.state.value}
                    onChange={field.handleChange}
                    doctype="Factory"
                  />
                </div>
              )}
            </form.Field>

            {/* Address */}
            <form.Field name="address">
              {(field) => (
                <div className="min-w-0 space-y-2 sm:col-span-2">
                  <Label htmlFor={field.name}>Address</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Street, locality, building..."
                    rows={3}
                  />
                </div>
              )}
            </form.Field>

            {/* City */}
            <form.Field name="city">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>City</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter city"
                    maxLength={100}
                  />
                </div>
              )}
            </form.Field>

            {/* State */}
            <form.Field name="state">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>State</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter state"
                    maxLength={100}
                  />
                </div>
              )}
            </form.Field>

            {/* PIN Code */}
            <form.Field name="postal_code">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>PIN Code</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter PIN code"
                    maxLength={12}
                  />
                </div>
              )}
            </form.Field>

            {/* Country */}
            <form.Field name="country">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>Country</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter country"
                    maxLength={100}
                  />
                </div>
              )}
            </form.Field>

            {/* Phone */}
            <form.Field name="phone_no">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>Phone Number</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="tel"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Enter phone number"
                    maxLength={20}
                  />
                </div>
              )}
            </form.Field>

            {/* Email */}
            <form.Field
              name="email"
              validators={{
                onBlur: ({ value }) =>
                  value.trim() &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
                    ? "Enter a valid email address"
                    : undefined,
              }}
            >
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="name@example.com"
                    maxLength={254}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Warehouse Manager */}
            <form.Field name="manager">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="warehouse-manager">Warehouse Manager</Label>
                  <LinkField
                    value={field.state.value}
                    onChange={field.handleChange}
                    doctype="User"
                  />
                </div>
              )}
            </form.Field>

            {/* Storage Capacity */}
            <form.Field
              name="capacity"
              validators={{
                onChange: ({ value }) =>
                  value != null && (!Number.isFinite(value) || value < 0)
                    ? "Capacity must be zero or greater"
                    : undefined,
              }}
            >
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={field.name}>Storage Capacity (Kg)</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={0}
                    step="any"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      const inputValue = event.target.value;
                      field.handleChange(
                        inputValue === "" ? undefined : Number(inputValue),
                      );
                    }}
                    placeholder="e.g. 50000"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Active Status */}
            <form.Field name="is_active">
              {(field) => (
                <div className="flex items-center gap-3 sm:col-span-2">
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
