import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import type { DocTypeDefinition } from "nodra";

import { GlobalToolbar } from "@/components/toolbar";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";
import type { WorkflowTransition } from "@/components/toolbar/toolbar-types";

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
  transitions?: WorkflowTransition[];
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
  transitions = [],
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
        setSubmitError(getErrorMessage(err));
      }
    },
    [onSubmit],
  );

  const form = useNodraForm(defaults, submitValues);

  useEffect(() => {
    form.reset(defaults);
    setSubmitError(null);
  }, [form, defaults]);

  const workflow = doctype.workflow;

  const currentWorkflowState = useMemo(
    () => workflow?.states.find((state) => state.state === documentStatus),
    [workflow, documentStatus],
  );

  // New documents can be saved before entering a workflow state.
  // Existing workflow documents are editable only in non-submitted,
  // non-cancelled, non-final states.
  const workflowAllowsEditing =
    mode === "create" ||
    !workflow ||
    (currentWorkflowState !== undefined &&
      currentWorkflowState.is_final !== true &&
      currentWorkflowState.doc_status !== 1 &&
      currentWorkflowState.doc_status !== 2);

  const showSaveCancel = mode !== "view" && workflowAllowsEditing;

  const canSave = showSaveCancel && !loading && !saving;

  const handleSubmit = useCallback(() => {
    if (!canSave) return;

    void form.handleSubmit();
  }, [canSave, form]);

  const handleCancel = useCallback(() => {
    if (!saving && showSaveCancel) {
      onCancel();
    }
  }, [saving, showSaveCancel, onCancel]);

  const defaultActions = useMemo<GlobalToolbarAction[]>(
    () => [
      {
        id: "back",
        label: "Back",
        variant: "outline",
        disabled: saving || loading,
        hidden: !showSaveCancel,
        onClick: handleCancel,
      },
      {
        id: "save",
        label: saving ? "Saving..." : "Save",
        variant: "default",
        disabled: !canSave,
        hidden: !showSaveCancel,
        onClick: handleSubmit,
      },
    ],
    [saving, loading, showSaveCancel, handleCancel, canSave, handleSubmit],
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
        transitions={transitions}
      />

      {(error || submitError) && (
        <div
          role="alert"
          className="whitespace-pre-line rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
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
                disabled={
                  saving || loading || mode === "view" || !workflowAllowsEditing
                }
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

//--Helper

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unable to save this document.";
  }

  if (
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null
  ) {
    const data = error.data;

    if ("details" in data && Array.isArray(data.details)) {
      const messages = data.details
        .map((detail: unknown) => {
          if (
            typeof detail === "object" &&
            detail !== null &&
            "message" in detail &&
            typeof detail.message === "string"
          ) {
            return detail.message;
          }

          return undefined;
        })
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) {
        return messages.join("\n");
      }
    }
  }

  return error.message;
}
