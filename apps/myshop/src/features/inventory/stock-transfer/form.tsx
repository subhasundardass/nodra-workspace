import * as React from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callMethod } from "@/lib/call-method";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

interface StockTransferFormProps {
  form: NodraForm;
}

interface FieldRowProps {
  label: string;
  htmlFor?: string;
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

function LocationFields({
  form,
  prefix,
  title,
}: {
  form: NodraForm;
  prefix: "source" | "destination";
  title: string;
}) {
  const typeField = `${prefix}_location_type` as
    "source_location_type" | "destination_location_type";

  const factoryField = `${prefix}_factory` as
    "source_factory" | "destination_factory";

  const warehouseField = `${prefix}_warehouse` as
    "source_warehouse" | "destination_warehouse";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>

      <form.Field name={typeField}>
        {(field) => (
          <FieldRow label="Location Type" htmlFor={field.name} required>
            <select
              id={field.name}
              name={field.name}
              value={String(field.state.value ?? "")}
              onChange={(event) => {
                const value = event.target.value;
                field.handleChange(value);

                form.setFieldValue(factoryField, "");
                form.setFieldValue(warehouseField, "");
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-none outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select Location Type</option>
              <option value="Factory">Factory</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </FieldRow>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values[typeField]}>
        {(locationType) => {
          if (locationType === "Factory") {
            return (
              <form.Field name={factoryField}>
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
            );
          }

          if (locationType === "Warehouse") {
            return (
              <form.Field name={warehouseField}>
                {(field) => (
                  <FieldRow label="Warehouse" htmlFor={field.name} required>
                    <LinkField
                      value={String(field.state.value ?? "")}
                      onChange={field.handleChange}
                      doctype="Warehouse"
                      className="w-full"
                    />
                  </FieldRow>
                )}
              </form.Field>
            );
          }

          return null;
        }}
      </form.Subscribe>
    </div>
  );
}

export function StockTransferForm({ form }: StockTransferFormProps) {
  const [lotInfo, setLotInfo] = React.useState({
    net_kg_per_bag: 0,
    bag_from_serial_no: 0,
    bag_to_serial_no: 0,
  });

  const [kgPerBag, setKgPerBag] = React.useState(0);

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
                onChange={async (value) => {
                  field.handleChange(value);

                  if (!value) {
                    setLotInfo({
                      net_kg_per_bag: 0,
                      bag_from_serial_no: 0,
                      bag_to_serial_no: 0,
                    });

                    form.setFieldValue("bags", 0);
                    form.setFieldValue("quantity", 0);
                    return;
                  }

                  try {
                    const result = await callMethod<{
                      document: {
                        bags: number;
                        net_kg_per_bag: number;
                        bag_from_serial_no: number;
                        bag_to_serial_no: number;
                      };
                    }>("document.get", {
                      doctype: "Lots",
                      name: value,
                    });

                    const lot = result.document;

                    const bags = Number(lot.bags ?? 0);
                    const kgPerBag = Number(lot.net_kg_per_bag ?? 0);

                    setLotInfo({
                      net_kg_per_bag: kgPerBag,
                      bag_from_serial_no: Number(lot.bag_from_serial_no ?? 0),
                      bag_to_serial_no: Number(lot.bag_to_serial_no ?? 0),
                    });

                    form.setFieldValue("bags", bags);
                    form.setFieldValue(
                      "quantity",
                      Number((bags * kgPerBag).toFixed(3)),
                    );
                  } catch (error) {
                    console.error("Failed to load Lot information:", error);
                  }
                }}
                doctype="Lots"
                titleField="lot_no"
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      {/* 2. Stock Transfer Locations */}
      <FormSection
        title="Stock Transfer Locations"
        description="Select the source and destination locations for this stock transfer."
      >
        <div className="col-span-1 grid min-w-0 grid-cols-1 gap-6 md:col-span-2 md:grid-cols-2">
          <LocationFields form={form} prefix="source" title="Source Location" />

          <LocationFields
            form={form}
            prefix="destination"
            title="Destination Location"
          />
        </div>
      </FormSection>

      {/* 3. Transfer Quantity */}

      <FormSection title="Transfer Quantity">
        <form.Field name="bags">
          {(field) => (
            <FieldRow label="Bags" htmlFor={field.name} required>
              <NumberInput
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0)}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  const bags = Math.max(0, Number(value) || 0);
                  field.handleChange(bags);

                  const kgPerBag = Number(lotInfo.net_kg_per_bag ?? 0);

                  form.setFieldValue(
                    "quantity",
                    Number((bags * kgPerBag).toFixed(3)),
                  );
                }}
              />
            </FieldRow>
          )}
        </form.Field>

        <FieldRow label="KG per Bag">
          <Input
            value={Number(lotInfo.net_kg_per_bag ?? 0).toFixed(3)}
            readOnly
            className="bg-muted"
            disabled
          />
        </FieldRow>

        <form.Field name="quantity">
          {(field) => (
            <FieldRow label="Total Kgs" htmlFor={field.name} required>
              <Input
                id={field.name}
                name={field.name}
                value={Number(field.state.value ?? 0).toFixed(3)}
                readOnly
                className="bg-muted font-medium"
              />
            </FieldRow>
          )}
        </form.Field>

        <FieldRow label="Bag From Sl No">
          <Input
            value={String(lotInfo.bag_from_serial_no ?? "")}
            readOnly
            className="bg-muted"
          />
        </FieldRow>

        <FieldRow label="Bag To Sl No">
          <Input
            value={String(lotInfo.bag_to_serial_no ?? "")}
            readOnly
            className="bg-muted"
          />
        </FieldRow>

        <form.Field name="remarks">
          {(field) => (
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
          )}
        </form.Field>
      </FormSection>
    </div>
  );
}
