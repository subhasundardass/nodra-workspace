import * as React from "react";

import { Input } from "@/components/ui/input";
import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

type DocumentRecord = Record<string, unknown>;

interface SaleEntryFormProps {
  form: NodraForm;
  lot: DocumentRecord;
  isEdit?: boolean;
  onLotChange?: (lot: string) => void;
}

function FieldRow({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-center gap-3">
      <label htmlFor={htmlFor} className="min-w-0 text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div className="min-w-0 *:w-full">{children}</div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
      <div className="space-y-0">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function ReadOnlyField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: unknown;
}) {
  return (
    <FieldRow label={label} htmlFor={name}>
      <DataField
        id={name}
        name={name}
        value={String(value ?? "")}
        onChange={() => undefined}
        readOnly
        className="w-full"
      />
    </FieldRow>
  );
}

export function SaleEntryForm({
  form,
  lot,
  isEdit = false,
  onLotChange,
}: SaleEntryFormProps) {
  const bags = Number(lot.bags ?? 0);
  const kgPerBag = Number(lot.net_kg_per_bag ?? 0);
  const totalKg = bags * kgPerBag;

  return (
    <div className="space-y-5">
      {/* Lot Details */}
      <FormSection
        title="Lot Details"
        description="Select a lot to load its details. Lot cannot be changed after the Sale Entry is created."
      >
        <form.Field name="lot">
          {(field) => (
            <FieldRow label="Lot No" htmlFor={field.name} required>
              <LinkField
                doctype="Lots"
                titleField="lot_no"
                value={String(field.state.value ?? "")}
                onChange={(value) => {
                  field.handleChange(value);
                  onLotChange?.(String(value ?? ""));
                }}
                filters={{ docstatus: 51 }}
                disabled={isEdit}
                className="w-full"
                placeholder="Select Lot No..."
              />
            </FieldRow>
          )}
        </form.Field>

        {/* <ReadOnlyField label="Lot No" name="lot_no" value={lot.name} /> */}

        <ReadOnlyField label="Factory" name="factory" value={lot.factory} />

        <ReadOnlyField
          label="Brand"
          name="original_brand"
          value={lot.original_brand}
        />

        <ReadOnlyField label="Grade" name="grade" value={lot.grade} />

        <ReadOnlyField label="Total Bags" name="total_bags" value={bags} />

        <ReadOnlyField
          label="KG Per Bag"
          name="net_kg_per_bag"
          value={kgPerBag}
        />

        <ReadOnlyField label="Total KG" name="total_kg" value={totalKg} />
      </FormSection>

      {/* Sale Details */}
      <FormSection
        title="Sale Details"
        description="Enter the sale date, type, broker, quantity and agreed rate."
      >
        <form.Field name="sale_date">
          {(field) => (
            <FieldRow label="Sale Date" htmlFor={field.name} required>
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

        <form.Field name="sale_type">
          {(field) => (
            <FieldRow label="Sale Type" htmlFor={field.name} required>
              <select
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "Bid")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-none"
              >
                <option value="Advance">Advance</option>
                <option value="Bid">Bid</option>
              </select>
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="broker">
          {(field) => (
            <FieldRow label="Broker" htmlFor={field.name} required>
              <LinkField
                doctype="Broker"
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="sold_bags">
          {(field) => (
            <FieldRow label="Sold Bags" htmlFor={field.name} required>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min={0}
                max={bags}
                value={String(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  const soldBags = Number(event.target.value || 0);

                  field.handleChange(soldBags);
                  form.setFieldValue("sold_quantity", soldBags * kgPerBag);
                }}
                className="bg-background text-right shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="sold_quantity">
          {(field) => (
            <FieldRow label="Sold KG" htmlFor={field.name} required>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min={0}
                max={totalKg}
                step="any"
                value={String(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value === "" ? 0 : Number(event.target.value),
                  )
                }
                className="bg-background text-right shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="rate">
          {(field) => (
            <FieldRow label="Selling Rate" htmlFor={field.name} required>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                min={1}
                step="any"
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value === "" ? 0 : Number(event.target.value),
                  )
                }
                className="bg-background text-right shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="remarks">
          {(field) => (
            <FieldRow label="Remarks" htmlFor={field.name}>
              <textarea
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>
    </div>
  );
}
