import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import type { DocTypeDefinition } from "nodra";

import { GlobalToolbar } from "@/components/toolbar";
import { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";

type FormValues = Record<string, unknown>;

function useNodraForm(
  defaultValues: FormValues,
  submitValues: (values: FormValues) => Promise<void>,
) {
  return useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await submitValues(value);
    },
  });
}

export type NodraForm = ReturnType<typeof useNodraForm>;

type DocTypeFormTemplateProps = {
  doctype: DocTypeDefinition;
  mode: "create" | "edit" | "view";
  initialValues?: FormValues;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  documentStatus?: string;
  toolbarActions?: GlobalToolbarAction[];
  children: (form: NodraForm) => ReactNode;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
};

function getInitialValues(
  doctype: DocTypeDefinition,
  initialValues: FormValues = {},
): FormValues {
  const values: FormValues = {};

  for (const field of doctype.fields ?? []) {
    const fieldname = field.fieldname;

    if (!fieldname) continue;

    if (Object.hasOwn(initialValues, fieldname)) {
      values[fieldname] = initialValues[fieldname];
    } else if (field.default !== undefined) {
      values[fieldname] = field.default;
    } else {
      values[fieldname] = "";
    }
  }

  // Preserve values that are not declared in the DocType.
  return { ...values, ...initialValues };
}

export function DocTypeFormTemplate({
  doctype,
  mode,
  initialValues,
  loading = false,
  saving = false,
  error = null,
  documentStatus,
  toolbarActions,
  children,
  onSubmit,
  onCancel,
}: DocTypeFormTemplateProps) {
  const defaults = useMemo(
    () => getInitialValues(doctype, initialValues),
    [doctype, initialValues],
  );

  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitValues = useCallback(
    async (values: FormValues) => {
      setSubmitError(null);

      try {
        await onSubmit(values);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Unable to save this document.",
        );
      }
    },
    [onSubmit],
  );

  const form = useNodraForm(defaults, submitValues);

  // Reset the form when the document defaults change.
  useEffect(() => {
    form.reset(defaults);
    setSubmitError(null);
  }, [form, defaults]);

  const canSave = !loading && !saving && mode !== "view";

  const handleSubmit = useCallback(() => {
    if (!canSave) return;
    void form.handleSubmit();
  }, [canSave, form]);

  const handleCancel = useCallback(() => {
    if (!saving) onCancel();
  }, [saving, onCancel]);

  const defaultActions = useMemo<GlobalToolbarAction[]>(
    () => [
      {
        id: "cancel",
        label: "Cancel",
        variant: "outline",
        disabled: saving,
        onClick: handleCancel,
      },
      {
        id: "save",
        label: saving ? "Saving..." : "Save",
        variant: "default",
        disabled: !canSave,
        hidden: mode === "view",
        onClick: handleSubmit,
      },
    ],
    [saving, handleCancel, canSave, mode, handleSubmit],
  );

  const actions = toolbarActions ?? defaultActions;

  const description =
    mode === "create"
      ? `Create a new ${doctype.name}`
      : mode === "view"
        ? `View ${String(initialValues?.name ?? doctype.name)}`
        : `Edit ${String(initialValues?.name ?? doctype.name)}`;

  return (
    <section className="w-full min-w-0 space-y-4 p-4">
      <GlobalToolbar
        title={doctype.name}
        description={description}
        documentStatus={documentStatus}
        actions={actions}
      />

      {(error || submitError) && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {submitError ?? error}
        </div>
      )}

      {loading ? (
        <div
          className="rounded-md border p-6 text-sm text-muted-foreground"
          role="status"
        >
          Loading document...
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-3">
          <div className="min-w-0 rounded-sm border bg-blue-50 p-3 dark:bg-muted/30 md:col-span-2">
            <form
              id={`doctype-form-${doctype.name}`}
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleSubmit();
              }}
              className="
                flex w-full min-w-0 flex-col shadow-none
                **:shadow-none
                [&_input:not([type=checkbox]):not([type=radio])]:bg-background
                [&_textarea]:bg-background
                [&_button[role=combobox]]:bg-background
                [&_select]:bg-background
                [&_input]:font-normal
                [&_textarea]:font-normal
                [&_select]:font-normal
                [&_button[role=combobox]]:font-normal
              "
            >
              <fieldset
                disabled={saving || mode === "view"}
                className="min-w-0"
              >
                <div className="w-full min-w-0 md:col-span-2">
                  {children(form)}
                </div>
              </fieldset>
            </form>
          </div>

          <aside className="flex min-w-0 flex-col overflow-hidden rounded-sm border bg-background md:sticky md:top-4 md:col-span-1 md:h-[calc(100vh-2rem)] md:self-start">
            <div className="shrink-0 border-b bg-muted/20 px-4 py-3">
              <h2 className="text-sm font-semibold">Document Logs</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Recent document activity
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <ul className="divide-y" />
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default DocTypeFormTemplate;
