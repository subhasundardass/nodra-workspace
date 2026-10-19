import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { DocTypeDefinition } from "nodra";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalToolbar } from "@/components/global-toolbar";
import { DocTypeFieldRenderer } from "../fields/field-renderer";

type FormValues = Record<string, unknown>;

type DocTypeFormTemplateProps = {
  doctype: DocTypeDefinition;
  mode: "create" | "edit";
  visibleFields?: string[];
  initialValues?: FormValues;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  documentStatus?: string;
  children?: ReactNode;
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

const fakeLogs = [
  {
    id: 1,
    initials: "SD",
    title: "Document Created",
    description: "Created this document",
    date: "16 Oct",
    time: "10:24 AM",
  },
  {
    id: 2,
    initials: "AM",
    title: "Details Updated",
    description: "Updated lot name and quantity",
    date: "16 Oct",
    time: "10:42 AM",
  },
  {
    id: 3,
    initials: "RK",
    title: "Status Changed",
    description: "Draft → Submitted",
    date: "16 Oct",
    time: "11:05 AM",
  },
  {
    id: 4,
    initials: "SD",
    title: "Comment Added",
    description: "Please verify the details",
    date: "16 Oct",
    time: "11:18 AM",
  },
  {
    id: 5,
    initials: "PM",
    title: "Assigned To",
    description: "Assigned to Purchase Manager",
    date: "16 Oct",
    time: "11:30 AM",
  },
];

export function DocTypeFormTemplate({
  doctype,
  mode,
  visibleFields,
  initialValues,
  loading = false,
  saving = false,
  error = null,
  documentStatus,
  children,
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

  const fields = (doctype.fields ?? []).filter(
    (field) =>
      Boolean(field.fieldname) &&
      !field.hidden &&
      (!visibleFields || visibleFields.includes(field.fieldname)),
  );

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
        <div className="min-w-0 rounded-sm border bg-card p-3 dark:bg-muted/30 md:col-span-2">
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
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 md:grid-cols-2">
              {children ??
                fields.map((field) => (
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
                className="h-8 gap-1.5 rounded-md px-4 font-semibold"
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

        <aside className="flex min-w-0 flex-col overflow-hidden rounded-sm border bg-background md:sticky md:top-4 md:col-span-1 md:h-[calc(100vh-2rem)] md:self-start">
          <div className="shrink-0 border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Document Logs</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {fakeLogs.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Recent document activity
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <ul className="divide-y">
              {fakeLogs.map((log) => (
                <li
                  key={log.id}
                  className="px-3 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {log.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{log.title}</p>
                        <div className="shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground">
                          {log.date} · {log.time}
                        </div>
                      </div>
                      <p className="mt-0 text-xs text-muted-foreground">
                        {log.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DocTypeFormTemplate;
