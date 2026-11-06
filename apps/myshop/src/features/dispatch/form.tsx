import type { ReactNode } from "react";

import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import { formatDate } from "@/lib/format";

type DispatchFormProps = {
  form: any;
};

export function DispatchForm({ form }: DispatchFormProps) {
  return (
    <div className="space-y-5">
      {/* 1. Dispatch Information */}

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold">Dispatch Information</h3>
          <p className="text-sm text-muted-foreground">
            Sale and buyer information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          <form.Field name="sale_book">
            {(field: any) => (
              <FieldRow label="Sale Book" htmlFor={field.name}>
                <LinkField
                  value={String(field.state.value ?? "")}
                  onChange={() => {}}
                  doctype="SaleBook"
                  readOnly
                  className="w-full"
                />
              </FieldRow>
            )}
          </form.Field>

          <form.Field name="dispatch_date">
            {(field: any) => (
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

          <form.Field name="party">
            {(field: any) => (
              <FieldRow label="Party" htmlFor={field.name}>
                <LinkField
                  value={String(field.state.value ?? "")}
                  onChange={() => {}}
                  doctype="Party"
                  readOnly
                  className="w-full"
                />
              </FieldRow>
            )}
          </form.Field>

          <form.Field name="broker">
            {(field: any) => (
              <FieldRow label="Broker" htmlFor={field.name}>
                <LinkField
                  value={String(field.state.value ?? "")}
                  onChange={() => {}}
                  doctype="Broker"
                  readOnly
                  className="w-full"
                />
              </FieldRow>
            )}
          </form.Field>
        </div>
      </section>

      {/* 2. Transport Information */}

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold">Transport Information</h3>
          <p className="text-sm text-muted-foreground">
            Transporter and dispatch references.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          <form.Field name="transporter">
            {(field: any) => (
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

          <form.Field name="lr_number">
            {(field: any) => (
              <FieldRow label="LR Number" htmlFor={field.name}>
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

          <form.Field name="challan_number">
            {(field: any) => (
              <FieldRow label="Challan Number" htmlFor={field.name}>
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
        </div>
      </section>

      {/* 3. Dispatch Quantity */}

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold">Dispatch Quantity</h3>
          <p className="text-sm text-muted-foreground">
            Quantities inherited from SaleBook.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          <form.Field name="total_bags">
            {(field: any) => (
              <FieldRow label="Total Bags" htmlFor={field.name}>
                <DataField
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? 0)}
                  onChange={() => {}}
                  readOnly
                  className="w-full"
                />
              </FieldRow>
            )}
          </form.Field>

          <form.Field name="total_kgs">
            {(field: any) => (
              <FieldRow label="Total KGs" htmlFor={field.name}>
                <DataField
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? 0)}
                  onChange={() => {}}
                  readOnly
                  className="w-full"
                />
              </FieldRow>
            )}
          </form.Field>
        </div>
      </section>

      {/* 4. Additional Information */}

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <h3 className="text-base font-semibold">Additional Information</h3>

        <form.Field name="remarks">
          {(field: any) => (
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
      </section>

      {/* 5. Workflow Information */}

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <h3 className="text-base font-semibold">Workflow Information</h3>

        <form.Field name="workflow_state">
          {(field: any) => (
            <FieldRow label="Status" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "Draft")}
                onChange={() => {}}
                readOnly
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>
      </section>
    </div>
  );
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
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-center gap-3">
      <label
        htmlFor={htmlFor}
        className="min-w-0 text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div className="min-w-0 *:w-full">{children}</div>
    </div>
  );
}
