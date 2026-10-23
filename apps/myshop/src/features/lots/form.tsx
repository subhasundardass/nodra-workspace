import * as React from "react";

import { Input } from "@/components/ui/input";
import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

interface LotFormProps {
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

export function LotForm({ form }: LotFormProps) {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
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

      <form.Field name="bags">
        {(field) => (
          <FieldRow label="Bags" htmlFor={field.name} required>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              min={0}
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

      <form.Field name="net_kg_per_bag">
        {(field) => (
          <FieldRow label="Net KG Per Bag" htmlFor={field.name} required>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              min={0}
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

      <form.Field name="warehouse">
        {(field) => (
          <FieldRow label="Warehouse/Godown" htmlFor={field.name} required>
            <LinkField
              value={String(field.state.value ?? "")}
              onChange={field.handleChange}
              doctype="Warehouse"
              className="w-full"
            />
          </FieldRow>
        )}
      </form.Field>

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
    </div>
  );
}
