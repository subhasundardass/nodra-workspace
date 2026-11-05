import * as React from "react";
import { useForm } from "@tanstack/react-form";

import { Input } from "@/components/ui/input";
import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

import { callMethod } from "@/lib/call-method";
import { formatDate } from "@/lib/format";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface DispatchFormProps {
  open: boolean;
  saleBook: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SaleBookDocument {
  name: string;
  sale_date: string;
  broker?: string | null;
  party?: string | null;
  party_address?: string | null;
  state?: string | null;
  city?: string | null;
  pincode?: string | null;
  bags?: number;
  total_kgs?: number;
}

interface DispatchFormValues {
  sale_book: string;
  sale_date: string;
  dispatch_date: string;
  broker: string;
  party: string;
  party_address: string;
  state: string;
  city: string;
  pincode: string;
  transporter: string;
  total_bags: number;
  total_kgs: number;
  remarks: string;
}

interface FieldRowProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function FieldRow({
  label,
  htmlFor,
  required = false,
  hint,
  children,
}: FieldRowProps) {
  return (
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-center gap-3">
      <label
        htmlFor={htmlFor}
        className="min-w-0 text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div className="min-w-0 space-y-1">
        <div className="*:w-full">{children}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function NumberInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  step = "1",
  readOnly = false,
}: {
  id: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  step?: string;
  readOnly?: boolean;
}) {
  return (
    <Input
      id={id}
      name={name}
      type="number"
      min={0}
      step={step}
      value={String(value)}
      onBlur={onBlur}
      onChange={(event) => {
        const value = event.target.value;
        onChange(value === "" ? 0 : Number(value));
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      className="bg-background text-right shadow-none"
    />
  );
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

const emptyValues: DispatchFormValues = {
  sale_book: "",
  sale_date: "",
  dispatch_date: "",
  broker: "",
  party: "",
  party_address: "",
  state: "",
  city: "",
  pincode: "",
  transporter: "",
  total_bags: 0,
  total_kgs: 0,
  remarks: "",
};

// -----------------------------------------------------------------------------
// Dispatch Form
// -----------------------------------------------------------------------------

export function DispatchForm({
  open,
  saleBook,
  onOpenChange,
  onSuccess,
}: DispatchFormProps) {
  const form = useForm({
    defaultValues: emptyValues,

    onSubmit: async ({ value }) => {
      // Connect dispatch.create here.
      console.log(value);
    },
  });

  // ---------------------------------------------------------------------------
  // Load Sale Book
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (!open || !saleBook) return;

    let cancelled = false;

    const loadSaleBook = async () => {
      try {
        const result = await callMethod<{
          document: SaleBookDocument;
        }>("document.get", {
          doctype: "SaleBook",
          name: saleBook,
        });

        if (cancelled) return;

        const doc = result.document;

        form.reset({
          ...emptyValues,
          sale_book: doc.name,
          sale_date: doc.sale_date ?? "",
          dispatch_date: getTodayDate(),
          broker: doc.broker ?? "",
          party: doc.party ?? "",
          party_address: doc.party_address ?? "",
          state: doc.state ?? "",
          city: doc.city ?? "",
          pincode: doc.pincode ?? "",
          total_bags: Number(doc.bags ?? 0),
          total_kgs: Number(doc.total_kgs ?? 0),
        });
      } catch (error) {
        console.error("Failed to load Sale Book:", error);
      }
    };

    loadSaleBook();

    return () => {
      cancelled = true;
    };
  }, [open, saleBook]);

  if (!saleBook) return null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-4xl"
      >
        <SheetHeader className="border-b px-5 py-3 pr-12">
          <SheetTitle>Create Dispatch</SheetTitle>

          <SheetDescription>
            Create a dispatch entry for Sale Book {saleBook}.
          </SheetDescription>
        </SheetHeader>

        <form
          id="dispatch-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-blue-50 px-5 py-4 dark:bg-muted/30"
        >
          {/* 1. Dispatch Information */}

          <FormSection
            title="Dispatch Information"
            description="Sale details and dispatch information."
          >
            <form.Field name="sale_book">
              {(field) => (
                <FieldRow label="Sale ID" htmlFor={field.name} required>
                  <DataField
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onChange={() => {}}
                    readOnly
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="sale_date">
              {(field) => (
                <FieldRow label="Sale Date" htmlFor={field.name}>
                  <DataField
                    id={field.name}
                    name={field.name}
                    value={formatDate(String(field.state.value ?? ""))}
                    onChange={() => {}}
                    readOnly
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="dispatch_date">
              {(field) => (
                <FieldRow label="Dispatch Date" htmlFor={field.name} required>
                  <DateField
                    id={field.name}
                    name={field.name}
                    value={formatDate(String(field.state.value ?? ""))}
                    onChange={field.handleChange}
                    className="w-full"
                    inputClassName="text-right"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="broker">
              {(field) => (
                <FieldRow label="Broker" htmlFor={field.name}>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Broker"
                    className="w-full"
                    readOnly
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="party">
              {(field) => (
                <FieldRow label="Buyer / Party" htmlFor={field.name} required>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Party"
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>
          </FormSection>

          {/* 2. Delivery Address */}

          <FormSection
            title="Delivery Address"
            description="Enter the buyer's delivery address."
          >
            <form.Field name="party_address">
              {(field) => (
                <FieldRow label="Address" htmlFor={field.name}>
                  <DataField
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="state">
              {(field) => (
                <FieldRow label="State" htmlFor={field.name}>
                  <DataField
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="city">
              {(field) => (
                <FieldRow label="City" htmlFor={field.name}>
                  <DataField
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="pincode">
              {(field) => (
                <FieldRow label="Pincode" htmlFor={field.name}>
                  <DataField
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>
          </FormSection>

          {/* 3. Dispatch Quantity */}

          <FormSection
            title="Dispatch Quantity"
            description="Sale Book quantity for dispatch."
          >
            <form.Field name="total_bags">
              {(field) => (
                <FieldRow label="Total Bags" htmlFor={field.name} required>
                  <NumberInput
                    id={field.name}
                    name={field.name}
                    value={Number(field.state.value ?? 0)}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    readOnly
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="total_kgs">
              {(field) => (
                <FieldRow label="Total KGs" htmlFor={field.name} required>
                  <NumberInput
                    id={field.name}
                    name={field.name}
                    value={Number(field.state.value ?? 0)}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    step="any"
                    readOnly
                  />
                </FieldRow>
              )}
            </form.Field>
          </FormSection>

          {/* 4. Transport Information */}

          <FormSection
            title="Transport Information"
            description="Select the transporter responsible for delivery."
          >
            <form.Field name="transporter">
              {(field) => (
                <FieldRow label="Transporter" htmlFor={field.name}>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Transporter"
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>
          </FormSection>

          {/* 5. Additional Information */}

          <FormSection title="Additional Information">
            <form.Field name="remarks">
              {(field) => (
                <FieldRow label="Remarks" htmlFor={field.name}>
                  <DataField
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>
          </FormSection>
        </form>

        {/* Footer */}

        <div className="flex justify-end gap-2 border-t bg-background px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button type="submit" form="dispatch-form" size="sm">
            Create Dispatch
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
