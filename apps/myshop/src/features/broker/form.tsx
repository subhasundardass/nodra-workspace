import type { ReactNode } from "react";

import { DataField } from "@/components/doctype/fields/data-field";
import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BrokerFormProps {
  form: NodraForm;
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

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function BrokerForm({ form }: BrokerFormProps) {
  return (
    <div className="space-y-4">
      <FormSection
        title="Broker Information"
        description="Enter the broker's name and business category."
      >
        <form.Field name="title">
          {(field) => (
            <FieldRow label="Broker Name" htmlFor={field.name} required>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                required
                placeholder="Enter broker name"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="broker_type">
          {(field) => (
            <FieldRow label="Broker Type" htmlFor={field.name} required>
              <select
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Select broker type</option>
                <option value="PRIVATE">Private Sale</option>
                <option value="TATA">TATA</option>
                <option value="HUL">HUL</option>
                <option value="AUCTION">Auction</option>
              </select>
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      <FormSection
        title="Contact Information"
        description="Enter the broker's contact details."
      >
        <form.Field name="contact_person">
          {(field) => (
            <FieldRow label="Contact Person" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter contact person"
              />
            </FieldRow>
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <FieldRow label="Phone" htmlFor={field.name} required>
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

        <form.Field name="state">
          {(field) => (
            <FieldRow label="State" htmlFor={field.name} required>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Select State"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="city">
          {(field) => (
            <FieldRow label="City" htmlFor={field.name} required>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter City"
              />
            </FieldRow>
          )}
        </form.Field>
        <form.Field name="pin">
          {(field) => (
            <FieldRow label="Pin" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                placeholder="Enter Pincode"
              />
            </FieldRow>
          )}
        </form.Field>

        {/* <div className="md:col-span-2">
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
                  placeholder="Enter broker address"
                  className="min-h-20 resize-y bg-background"
                />
              </div>
            )}
          </form.Field>
        </div> */}
      </FormSection>

      {/* Bank Details */}
      <FormSection
        title="Bank Details"
        description="Enter the broker's bank account details. All fields are optional."
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

      <FormSection
        title="Availability"
        description="Control whether this broker is available for new transactions."
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
