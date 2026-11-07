import type { ReactNode } from "react";

import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";

type DispatchFormProps = {
  form: any;
};

export function DispatchForm({ form }: DispatchFormProps) {
  return (
    <div className="space-y-2">
      {/* 1. Sale Information */}

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold">Sale Information</h3>
          <p className="text-sm text-muted-foreground">
            Sale and buyer information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-3">
          <form.Field name="sale_book">
            {(field: any) => (
              <FieldRow label="SaleBook ID" htmlFor={field.name}>
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
            {(field: any) => (
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
          <form.Field name="lot_id">
            {(field: any) => (
              <FieldRow label="Lot ID" htmlFor={field.name}>
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

      {/* 2. Dispatch Information */}
      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold">Dispatch Information</h3>
          <p className="text-sm text-muted-foreground">
            Sale and buyer information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-3">
          <div className="col-span-2">
            <form.Field name="party">
              {(field: any) => (
                <FieldRow label="Party" htmlFor={field.name} required>
                  <LinkField
                    value={String(field.state.value ?? "")}
                    onChange={field.handleChange}
                    doctype="Party"
                    className="w-full"
                  />
                </FieldRow>
              )}
            </form.Field>
          </div>

          <div className="col-span-1">
            <form.Field name="dispatch_date">
              {(field: any) => (
                <FieldRow label="Dispatch Date" htmlFor={field.name} required>
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
          </div>

          <div className="col-span-1">
            <form.Field name="payment_type">
              {(field: any) => (
                <FieldRow label="Payment Type" required htmlFor={field.name}>
                  <Select
                    value={String(field.state.value ?? "DUE")}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DUE">Due</SelectItem>
                      <SelectItem value="DISCOUNT">Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(state: any) => state.values.payment_type}>
            {(paymentType: string) => (
              <div className="col-span-1">
                <form.Field name="discount_percentage">
                  {(field: any) => (
                    <FieldRow label="Discount (%)" htmlFor={field.name}>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={paymentType !== "DISCOUNT"}
                        value={String(field.state.value ?? "")}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        placeholder="%"
                        className="text-right"
                      />
                    </FieldRow>
                  )}
                </form.Field>
              </div>
            )}
          </form.Subscribe>

          <div className="col-span-1">
            <form.Field name="received_date">
              {(field: any) => (
                <FieldRow label="Receive Date" htmlFor={field.name} required>
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
          </div>

          <div className="col-span-3">
            <form.Field name="remarks">
              {(field: any) => (
                <FieldRow label="Remarks" htmlFor={field.name}>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Enter remarks"
                  />
                </FieldRow>
              )}
            </form.Field>
          </div>
        </div>
      </section>
      {/* 3. Transport Information */}

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold">Transport Information</h3>
          <p className="text-sm text-muted-foreground">
            Transporter and dispatch references.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
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
