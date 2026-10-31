import type { ReactNode } from "react";

import { DataField } from "@/components/doctype/fields/data-field";
import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BrokerOption {
  name: string;
  title: string;
  city?: string;
  state?: string;
  phone?: string;
}

interface PartyBrokerRow {
  broker: string;
  commission_rate?: number;
  notes?: string;
}

interface PartyFormProps {
  form: NodraForm;
  brokers?: BrokerOption[];
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
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-start gap-3">
      <label
        htmlFor={htmlFor}
        className="pt-2 text-sm font-medium text-muted-foreground"
      >
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
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function PartyForm({ form, brokers = [] }: PartyFormProps) {
  return (
    <div className="space-y-6">
      {/* Party Information */}
      <FormSection
        title="Party Information"
        description="Enter the basic details of the company or individual."
      >
        <form.Field name="title">
          {(field) => (
            <FieldRow label="Party Name" htmlFor={field.name} required>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                required
                placeholder="Enter company or individual name"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="party_type">
          {(field) => (
            <FieldRow label="Party Type" htmlFor={field.name} required>
              <select
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "Company")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="Company">Company</option>
                <option value="Individual">Individual</option>
              </select>
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="phone">
          {(field) => (
            <FieldRow label="Phone" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter contact number"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <FieldRow label="Email" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter email address"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      {/* Business Details */}
      <FormSection
        title="Business Details"
        description="Add registration details and the party's address where applicable."
      >
        <form.Field name="gstin">
          {(field) => (
            <FieldRow label="GSTIN" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter GSTIN"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="pan">
          {(field) => (
            <FieldRow label="PAN" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter PAN"
              />
            </FieldRow>
          )}
        </form.Field>

        <div className="md:col-span-1">
          <form.Field name="address">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Address
                </label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "")}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Enter business or residential address"
                  className="min-h-20 resize-y bg-background"
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="md:col-span-1">
          <form.Field name="notes">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Notes
                </label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "")}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Additional information"
                  className="min-h-20 resize-y bg-background"
                />
              </div>
            )}
          </form.Field>
        </div>
      </FormSection>

      {/* Broker Information */}
      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Broker Information</h3>
          <p className="text-sm text-muted-foreground">
            Add one or more brokers associated with this party. At least one
            broker is required.
          </p>
        </div>

        <form.Field name="brokers">
          {(field) => {
            const rows = Array.isArray(field.state.value)
              ? (field.state.value as PartyBrokerRow[])
              : [];

            return (
              <div className="space-y-3">
                {/* Column headings */}
                <div className="grid grid-cols-[minmax(160px,1.5fr)_minmax(90px,0.8fr)_minmax(90px,0.8fr)_minmax(110px,0.9fr)_110px_36px] gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Broker <span className="text-destructive">*</span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    City
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    State
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Phone
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Commission (%)
                  </span>
                  <span />
                </div>

                {rows.map((row, index) => {
                  const selectedBroker = brokers.find(
                    (broker) => broker.name === row.broker,
                  );

                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(160px,1.5fr)_minmax(90px,0.8fr)_minmax(90px,0.8fr)_minmax(110px,0.9fr)_110px_36px] items-center gap-2"
                    >
                      {/* Broker */}
                      <form.Field name={`brokers[${index}].broker`}>
                        {(brokerField) => (
                          <select
                            id={brokerField.name}
                            name={brokerField.name}
                            value={String(brokerField.state.value ?? "")}
                            onBlur={brokerField.handleBlur}
                            onChange={(event) =>
                              brokerField.handleChange(event.target.value)
                            }
                            required
                            className="h-9 min-w-0 w-full rounded-md border border-input bg-background px-2 text-sm"
                          >
                            <option value="">Select Broker</option>

                            {brokers.map((broker) => (
                              <option key={broker.name} value={broker.name}>
                                {broker.title}
                              </option>
                            ))}
                          </select>
                        )}
                      </form.Field>

                      {/* City */}
                      <div
                        className="truncate rounded-md bg-muted/40 px-2 py-2 text-sm"
                        title={selectedBroker?.city || ""}
                      >
                        {selectedBroker?.city || "-"}
                      </div>

                      {/* State */}
                      <div
                        className="truncate rounded-md bg-muted/40 px-2 py-2 text-sm"
                        title={selectedBroker?.state || ""}
                      >
                        {selectedBroker?.state || "-"}
                      </div>

                      {/* Phone */}
                      <div
                        className="truncate rounded-md bg-muted/40 px-2 py-2 text-sm"
                        title={selectedBroker?.phone || ""}
                      >
                        {selectedBroker?.phone || "-"}
                      </div>

                      {/* Commission */}
                      <form.Field name={`brokers[${index}].commission_rate`}>
                        {(commissionField) => (
                          <input
                            id={commissionField.name}
                            name={commissionField.name}
                            type="number"
                            min="0"
                            step="0.01"
                            value={String(commissionField.state.value ?? "")}
                            onBlur={commissionField.handleBlur}
                            onChange={(event) => {
                              const value = event.target.value;
                              commissionField.handleChange(
                                value === "" ? undefined : Number(value),
                              );
                            }}
                            placeholder="0.00"
                            className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm"
                          />
                        )}
                      </form.Field>

                      {/* Remove */}
                      <button
                        type="button"
                        disabled={rows.length <= 1}
                        onClick={() => {
                          field.handleChange(
                            rows.filter((_, rowIndex) => rowIndex !== index),
                          );
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          rows.length <= 1
                            ? "At least one broker is required"
                            : "Remove Broker"
                        }
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {rows.length === 0 && (
                  <p className="text-sm text-destructive">
                    At least one broker is required.
                  </p>
                )}

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {rows.length} broker(s) added
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      field.handleChange([
                        ...rows,
                        {
                          broker: "",
                          commission_rate: undefined,
                          notes: "",
                        },
                      ]);
                    }}
                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    + Add Broker
                  </button>
                </div>
              </div>
            );
          }}
        </form.Field>
      </section>

      {/* Bank Detail */}

      {/* Bank Details */}
      <FormSection
        title="Bank Details"
        description="Enter the party's bank account information for payments and settlements."
      >
        <form.Field name="bank_name">
          {(field) => (
            <FieldRow label="Bank Name" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter bank name"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="account_holder_name">
          {(field) => (
            <FieldRow label="Account Holder" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter account holder name"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="account_number">
          {(field) => (
            <FieldRow label="Account Number" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter account number"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="ifsc">
          {(field) => (
            <FieldRow label="IFSC Code" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter IFSC code"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="branch">
          {(field) => (
            <FieldRow label="Branch" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter branch name"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="account_type">
          {(field) => (
            <FieldRow label="Account Type" htmlFor={field.name}>
              <select
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(event.target.value || undefined)
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select Account Type</option>
                <option value="Current">Current</option>
                <option value="Savings">Savings</option>
                <option value="Other">Other</option>
              </select>
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      {/* Availability */}
      <FormSection
        title="Availability"
        description="Control whether this party is available for new transactions."
      >
        <form.Field name="is_active">
          {(field) => (
            <div className="flex items-center gap-3 md:col-span-2">
              <Checkbox
                id={field.name}
                checked={
                  field.state.value === true ||
                  field.state.value === "1" ||
                  field.state.value === 1
                }
                onCheckedChange={(checked) =>
                  field.handleChange(checked === true)
                }
              />
              <Label htmlFor={field.name}>Active</Label>
            </div>
          )}
        </form.Field>

        <form.Field name="workflow_state">
          {(field) => (
            <FieldRow label="Workflow State" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "Draft")}
                onChange={() => {}}
                readOnly
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>
    </div>
  );
}
