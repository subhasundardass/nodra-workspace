// components/doctype/doctype-form-template.tsx

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { DocTypeDefinition } from "nodra";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlobalToolbar } from "@/components/global-toolbar";
import { DocTypeFieldRenderer } from "../fields/field-renderer";

type FormValues = Record<string, unknown>;

type DocTypeFormTemplateProps = {
  doctype: DocTypeDefinition;
  mode: "create" | "edit";
  initialValues?: FormValues;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  documentStatus?: string;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
};

function getInitialValues(
  doctype: DocTypeDefinition,
  initialValues: FormValues = {},
): FormValues {
  const values: FormValues = {};

  for (const field of doctype.fields ?? []) {
    if (!field.fieldname) continue;

    if (Object.hasOwn(initialValues, field.fieldname)) {
      values[field.fieldname] = initialValues[field.fieldname];
    } else if (field.default !== undefined) {
      values[field.fieldname] = field.default;
    } else {
      values[field.fieldname] = "";
    }
  }

  return values;
}

export function DocTypeFormTemplate({
  doctype,
  mode,
  initialValues,
  loading = false,
  saving = false,
  error = null,
  documentStatus,
  onSubmit,
  onCancel,
}: DocTypeFormTemplateProps) {
  const defaults = useMemo(
    () => getInitialValues(doctype, initialValues),
    [doctype, initialValues],
  );

  const [values, setValues] = useState<FormValues>(defaults);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setValues(defaults);
    setSubmitError(null);
  }, [defaults]);

  const fields = (doctype.fields ?? []).filter((field) => !field.hidden);
  const canSave = !loading && !saving;

  function updateField(fieldname: string, value: unknown) {
    setValues((current) => ({
      ...current,
      [fieldname]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) return;

    setSubmitError(null);

    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unable to save this document.",
      );
    }
  }

  return (
    <section className="w-full min-w-0 space-y-4 p-4">
      <GlobalToolbar
        title={doctype.name}
        description={
          mode === "create"
            ? `Create a new ${doctype.name}`
            : `Edit ${String(values.name ?? doctype.name)}`
        }
        breadcrumbs={[
          { label: "Masters", href: "/dashboard/master" },
          { label: doctype.name, href: "/dashboard/master" },
          { label: mode === "create" ? "New" : "Edit" },
        ]}
        documentStatus={documentStatus}
        actions={[
          {
            id: "cancel",
            label: "Cancel",
            icon: ArrowLeft,
            variant: "outline",
            onClick: onCancel,
          },
          {
            id: "save",
            label: saving ? "Saving..." : "Save",
            icon: Save,
            variant: "default",
            disabled: !canSave,
            onClick: () => {
              const form = document.getElementById(
                `doctype-form-${doctype.name}`,
              ) as HTMLFormElement | null;

              form?.requestSubmit();
            },
          },
        ]}
      />

      {(error || submitError) && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {submitError ?? error}
        </div>
      )}

      <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-3">
        {/* Form: 2/3 */}
        <div className="min-w-0 md:col-span-2 rounded-sm border  p-3  bg-card dark:bg-muted/30">
          <div className="">
            <form
              id={`doctype-form-${doctype.name}`}
              onSubmit={handleSubmit}
              className="
                flex w-full min-w-0 flex-col
                [&_input:not([type=checkbox]):not([type=radio])]:bg-sky-50
                [&_textarea]:bg-sky-50
                [&_button[role=combobox]]:bg-sky-50
                [&_select]:bg-sky-50
                dark:[&_input:not([type=checkbox]):not([type=radio])]:bg-sky-950/40
                dark:[&_textarea]:bg-sky-950/40
                dark:[&_button[role=combobox]]:bg-sky-950/40
                dark:[&_select]:bg-sky-950/40
                [&_input]:font-bold
                [&_textarea]:font-bold
                [&_select]:font-bold
                [&_button[role=combobox]]:font-bold
              "
            >
              {/* Fields */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 md:grid-cols-2">
                {fields.map((field) => (
                  <div
                    key={field.fieldname}
                    className={
                      field.fieldtype === "Table"
                        ? "col-span-full min-w-0 border-t pt-4"
                        : "min-w-0"
                    }
                  >
                    <DocTypeFieldRenderer
                      field={field}
                      value={values[field.fieldname]}
                      onChange={(value: unknown) =>
                        updateField(field.fieldname, value)
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Sticky action bar */}
              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 rounded-b-lg border-t bg-muted/60 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-muted/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={saving}
                  className="h-8 rounded-md px-3 font-semibold"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSave}
                  className="h-8 gap-1.5 rounded-md px-4  font-semibold"
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
        {/* Sidebar: 1/3 */}
        <aside className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-primary-foreground md:sticky md:top-4 md:col-span-1 md:h-[calc(100vh-2rem)] md:self-start">
          {/* Fixed header */}
          <div className="shrink-0 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Document Logs</h2>
          </div>

          {/* Scrollable body */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
            <p className="text-sm text-muted-foreground">
              Document activity and history will appear here.
            </p>

            {/* Your log items go here, for example: */}
            {/* {logs.map((log) => <LogItem key={log.id} log={log} />)} */}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DocTypeFormTemplate;
