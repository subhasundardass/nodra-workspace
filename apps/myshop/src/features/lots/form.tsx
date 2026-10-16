import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import type { DocTypeDefinition } from "nodra";
import { DocTypeFieldRenderer } from "@/components/doctype/fields/field-renderer";

type LotFormProps = {
  doctype: DocTypeDefinition;
  mode: "create" | "edit";
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
};

function getInitialValues(
  doctype: DocTypeDefinition,
  initialValues: Record<string, unknown> = {},
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of doctype.fields ?? []) {
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
  onSubmit,
}: LotFormProps) {
  const submitLabel = mode === "create" ? "Create" : "Save Changes";
  const form = useForm({
    defaultValues: getInitialValues(doctype, initialValues),

    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  // Reset the form when switching records or receiving new initial values.
  useEffect(() => {
    form.reset(getInitialValues(doctype, initialValues));
  }, [doctype, initialValues, form]);

  const fields = (doctype.fields ?? []).filter((field) => !field.hidden);

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
              <div className="space-y-1">
                <DocTypeFieldRenderer
                  field={field}
                  value={fieldApi.state.value}
                  onChange={fieldApi.handleChange}
                />

                {fieldApi.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {fieldApi.state.meta.errors
                      .map((error) => String(error))
                      .join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        ))}
      </div>

      <div className="flex justify-end">
        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ isSubmitting }) => (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Lot"}
            </button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
