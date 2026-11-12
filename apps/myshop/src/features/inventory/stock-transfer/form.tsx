import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

interface StockTransferFormProps {
  form: NodraForm;
}

interface FieldRowProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldRow({
  label,
  htmlFor,
  required = false,
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
    <section className="space-y-2 rounded-lg border bg-card p-4 md:p-5">
      <div className="space-y-0">
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
  step = "1",
}: {
  id: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  step?: string;
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
      className="bg-background text-right shadow-none"
    />
  );
}

export function StockTransferForm({ form }: StockTransferFormProps) {
  return (
    <div className="space-y-4">
      {/* 1. Transfer Information */}
      <FormSection title="Transfer Information">
        <form.Field name="transfer_date">
          {(field) => (
            <FieldRow label="Transfer Date" htmlFor={field.name} required>
              <DateField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                className="w-full"
                inputClassName="text-right"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="lot">
          {(field) => (
            <FieldRow label="Lot" htmlFor={field.name} required>
              <LinkField
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                doctype="Lots"
                titleField="lot_no"
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      <FormSection
        title="Stock Transfer Locations"
        description="Select the source and destination locations for this stock transfer."
      >
        <div className="col-span-1 grid min-w-0 grid-cols-1 gap-6 md:col-span-2 md:grid-cols-2">
          {/* Source Location */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Source Location</h3>

            <form.Field name="source_location_type">
              {(field) => (
                <FieldRow label="Location Type" htmlFor={field.name} required>
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

            <form.Field name="source_factory">
              {(field) => (
                <FieldRow label="Factory" htmlFor={field.name}>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Factory"
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="source_warehouse">
              {(field) => (
                <FieldRow label="Warehouse" htmlFor={field.name}>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Warehouse"
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>
          </div>

          {/* Destination Location */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Destination Location</h3>

            <form.Field name="destination_location_type">
              {(field) => (
                <FieldRow label="Location Type" htmlFor={field.name} required>
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

            <form.Field name="destination_factory">
              {(field) => (
                <FieldRow label="Factory" htmlFor={field.name}>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Factory"
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>

            <form.Field name="destination_warehouse">
              {(field) => (
                <FieldRow label="Warehouse" htmlFor={field.name}>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Warehouse"
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>
          </div>
        </div>
      </FormSection>

      {/* 4. Transfer Quantity */}
      <FormSection title="Transfer Quantity">
        <form.Field name="bags">
          {(field) => (
            <FieldRow label="Bags" htmlFor={field.name} required>
              <NumberInput
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="quantity">
          {(field) => (
            <FieldRow label="Quantity (KG)" htmlFor={field.name} required>
              <NumberInput
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                step="0.001"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="remarks">
          {(field) => (
            <div className="md:col-span-2">
              <FieldRow label="Remarks" htmlFor={field.name}>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "")}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter remarks"
                />
              </FieldRow>
            </div>
          )}
        </form.Field>
      </FormSection>
    </div>
  );
}
