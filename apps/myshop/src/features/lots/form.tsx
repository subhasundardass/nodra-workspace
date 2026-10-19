import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import type { DocTypeDefinition } from "nodra";
import { DocTypeFieldRenderer } from "@/components/doctype/fields/field-renderer";

type LotFormProps = {
  doctype: DocTypeDefinition;
  mode: "create" | "edit" | "view";
  initialValues?: Record<string, unknown>;
  visibleFields?: string[];
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
};

function getInitialValues(
  doctype: DocTypeDefinition,
  initialValues: Record<string, unknown> = {},
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of doctype.fields ?? []) {
    if (!field.fieldname) continue;

    values[field.fieldname] =
      initialValues[field.fieldname] !== undefined
        ? initialValues[field.fieldname]
        : (field.default ?? "");
  }

  return values;
}

export function LotForm({
  doctype,
  mode,
  initialValues = {},
  visibleFields,
  onSubmit,
}: LotFormProps) {
  const form = useForm({
    defaultValues: getInitialValues(doctype, initialValues),

    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  useEffect(() => {
    form.reset(getInitialValues(doctype, initialValues));
  }, [doctype, initialValues, form]);

  const fields = (doctype.fields ?? []).filter((field) => {
    const show =
      !field.hidden &&
      (!visibleFields || visibleFields.includes(field.fieldname));

    console.log("Field:", field.fieldname, "Show:", show);

    return show;
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <form.Field key={field.fieldname} name={field.fieldname}>
            {(fieldApi) => (
              <div className="min-w-0 space-y-1">
                <DocTypeFieldRenderer
                  field={field}
                  value={fieldApi.state.value}
                  onChange={fieldApi.handleChange}
                />
              </div>
            )}
          </form.Field>
        ))}
      </div>
    </form>
  );
}
