import type { ReactNode } from "react";

import { DataField } from "@/components/doctype/fields/data-field";
import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PartyFormProps {
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

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function PartyForm({ form }: PartyFormProps) {
  return (
    <div className="space-y-6">
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

      {/* Party Role */}
      <FormSection
        title="Party Roles"
        description="Select all roles that apply to this party."
      >
        {[
          { name: "is_supplier", label: "Supplier" },
          { name: "is_buyer", label: "Buyer" },
          { name: "is_agent", label: "Agent / Broker" },
          { name: "is_tea_owner", label: "Tea Owner" },
          { name: "is_transporter", label: "Transporter" },
        ].map((role) => (
          <form.Field key={role.name} name={role.name}>
            {(field) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id={field.name}
                  checked={
                    field.state.value === true ||
                    field.state.value === 1 ||
                    field.state.value === "1"
                  }
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <Label htmlFor={field.name}>{role.label}</Label>
              </div>
            )}
          </form.Field>
        ))}
      </FormSection>

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
