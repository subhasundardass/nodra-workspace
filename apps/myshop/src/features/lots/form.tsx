import * as React from "react";

import { Input } from "@/components/ui/input";
import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

interface LotFormProps {
  form: NodraForm;
}

interface FieldRowProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

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
}: {
  id: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
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
      placeholder={placeholder}
      className="bg-background text-right shadow-none"
    />
  );
}

export function LotForm({ form }: LotFormProps) {
  return (
    <div className="space-y-2">
      {/* 1. Entry Information */}
      <FormSection
        title="Entry Information"
        description="Enter the basic information about the incoming tea lot."
      >
        <form.Field name="entry_date">
          {(field) => (
            <FieldRow label="Entry Date" htmlFor={field.name} required>
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

        <form.Field name="arrival_date">
          {(field) => (
            <FieldRow label="Arrival Date" htmlFor={field.name} required>
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

        <form.Field name="factory">
          {(field) => (
            <FieldRow label="Factory" htmlFor={field.name} required>
              <LinkField
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                doctype="Factory"
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="id">
          {(field) => (
            <FieldRow label="ID" htmlFor={field.name}>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Enter reference ID"
                className="bg-background shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      {/* 2. Tea Lot Details */}
      <FormSection
        title="Tea Lot Details"
        description="Identify the lot and its tea grade and brand."
      >
        <form.Field name="lot_no">
          {(field) => (
            <FieldRow label="Lot No" htmlFor={field.name} required>
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

        <form.Field name="grade">
          {(field) => (
            <FieldRow label="Grade" htmlFor={field.name}>
              <LinkField
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                doctype="Grades"
                titleField="grade_code"
                pageSize={10}
                clearable={false}
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="original_brand">
          {(field) => (
            <FieldRow label="Original Brand" htmlFor={field.name}>
              <LinkField
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                doctype="Brand"
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      {/* 3. Bag Information */}
      <FormSection
        title="Bag Information"
        description="Enter the quantity, bag serial range and net weight."
      >
        <form.Field name="bag_from_serial_no">
          {(field) => (
            <FieldRow label="Bag From Sl. No" htmlFor={field.name}>
              <NumberInput
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                placeholder="Starting serial number"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="bag_to_serial_no">
          {(field) => (
            <FieldRow label="Bag To Sl. No" htmlFor={field.name}>
              <NumberInput
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                placeholder="Ending serial number"
              />
            </FieldRow>
          )}
        </form.Field>
        <form.Field name="bags">
          {(field) => (
            <FieldRow label="Total Bags" htmlFor={field.name} required>
              <NumberInput
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                placeholder="Enter number of bags"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="net_kg_per_bag">
          {(field) => (
            <FieldRow label="Net KG Per Bag" htmlFor={field.name} required>
              <NumberInput
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                step="any"
                placeholder="Enter weight in KG"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      {/* 4. Storage Information */}
      {/* <FormSection
        title="Storage Information"
        description="Select where this tea lot will be stored."
      >
        <form.Field name="warehouse">
          {(field) => (
            <FieldRow label="WH / Godown" htmlFor={field.name} required>
              <LinkField
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                doctype="Warehouse"
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection> */}

      {/* 5. Workflow Status */}
      {/* <FormSection title="Workflow Status">
        <form.Field name="workflow_state">
          {(field) => (
            <FieldRow label="Status" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "Draft")}
                onChange={field.handleChange}
                readOnly
                className="w-full"
                inputClassName="text-right"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection> */}
    </div>
  );
}
