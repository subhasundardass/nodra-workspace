import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import type { DocTypeDefinition } from "nodra";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GlobalToolbar } from "@/components/toolbar";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

type WorkflowState = {
  state: string;
  doc_status: number;
  is_initial?: boolean;
  is_final?: boolean;
};

type WorkflowTransitionDefinition = {
  action: string;
  from?: string;
  to?: string;
  roles?: string[];
  from_state?: string;
  to_state?: string;
  allowed_roles?: string[];
};

type WorkflowMetadata = {
  state_field: string;
  states: WorkflowState[];
  transitions: WorkflowTransitionDefinition[];
};

type WorkflowDocType = DocTypeDefinition & {
  workflow?: WorkflowMetadata;
};

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

  // Preserve metadata-independent values such as name, docstatus,
  // workflow_state, owner, and modified.
  return { ...values, ...initialValues };
}

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "The operation could not be completed.";
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
  const workflowDoctype = doctype as WorkflowDocType;
  const workflow = workflowDoctype.workflow;

  const defaults = useMemo(
    () => getInitialValues(doctype, initialValues),
    [doctype, initialValues],
  );

  const [documentValues, setDocumentValues] = useState<FormValues>(defaults);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

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
    setDocumentValues(defaults);
    form.reset(defaults);
    setSubmitError(null);
    setTransitionError(null);
  }, [defaults, form]);

  // Read the workflow state from the actual loaded document.
  // Fall back to documentStatus/docstatus for older callers or documents.
  const currentWorkflowStateName = useMemo(() => {
    if (!workflow) return documentStatus;

    const stateValue = documentValues[workflow.state_field];

    if (typeof stateValue === "string" && stateValue.trim()) {
      return stateValue;
    }

    if (documentStatus) {
      const namedState = workflow.states.find(
        (state) => state.state === documentStatus,
      );

      if (namedState) return namedState.state;

      const statusNumber = Number(documentStatus);
      if (Number.isFinite(statusNumber)) {
        const statusState = workflow.states.find(
          (state) => state.doc_status === statusNumber,
        );

        if (statusState) return statusState.state;
      }
    }

    const rawDocStatus = documentValues.docstatus;
    const numericDocStatus =
      typeof rawDocStatus === "number"
        ? rawDocStatus
        : typeof rawDocStatus === "string" && rawDocStatus.trim()
          ? Number(rawDocStatus)
          : undefined;

    if (numericDocStatus !== undefined && Number.isFinite(numericDocStatus)) {
      return workflow.states.find(
        (state) => state.doc_status === numericDocStatus,
      )?.state;
    }

    return undefined;
  }, [workflow, documentValues, documentStatus]);

  const currentWorkflowState = useMemo(
    () =>
      workflow?.states.find(
        (state) => state.state === currentWorkflowStateName,
      ),
    [workflow, currentWorkflowStateName],
  );

  const isInitialState =
    currentWorkflowState?.is_initial === true ||
    currentWorkflowState?.doc_status === 0;

  // Save fields only in the initial workflow state.
  // Workflow actions remain available independently of field editing.
  const workflowAllowsEditing =
    mode === "create" ||
    !workflow ||
    (currentWorkflowState !== undefined &&
      isInitialState &&
      currentWorkflowState.is_final !== true);

  const showSaveCancel = mode !== "view" && workflowAllowsEditing;
  const canSave = showSaveCancel && !loading && !saving && !transitioning;
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<
    string | null
  >(null);

  const handleSubmit = useCallback(() => {
    if (!canSave) return;
    void form.handleSubmit();
  }, [canSave, form]);

  const handleCancel = useCallback(() => {
    if (!saving && !transitioning && showSaveCancel) {
      onCancel();
    }
  }, [saving, transitioning, showSaveCancel, onCancel]);

  // Execute a transition through Nodra's registered server method.
  // Never update workflow_state or docstatus directly in the browser.

  const handleWorkflowTransition = useCallback(
    async (action: string) => {
      const name = documentValues.name;

      if (typeof name !== "string" || !name.trim()) {
        setTransitionError(
          "Save this document before running a workflow action.",
        );
        return;
      }

      if (loading || saving || transitioning) return;

      setTransitionError(null);
      setTransitioning(true);

      try {
        await callMethod("document.transition", {
          doctype: doctype.name,
          name,
          action,
        });

        const result = await callMethod<{ document: FormValues }>(
          "document.get",
          {
            doctype: doctype.name,
            name,
          },
        );

        if (!result?.document) {
          throw new Error(
            "The document was transitioned but could not be reloaded.",
          );
        }

        const nextValues = getInitialValues(doctype, result.document);

        // Update the document state and reset the form.
        setDocumentValues(nextValues);
        form.reset(nextValues);

        // Revalidate fields after resetting the form.
        await form.validateAllFields("change");

        setTransitionError(null);
      } catch (err) {
        setTransitionError(getErrorMessage(err));
      } finally {
        setTransitioning(false);
      }
    },
    [documentValues.name, doctype, form, loading, saving, transitioning],
  );

  // Normalize both metadata naming styles:
  // app DocType: from/to/roles
  // workflow engine: from_state/to_state/allowed_roles

  const workflowActions = useMemo<GlobalToolbarAction[]>(() => {
    if (
      mode === "create" ||
      !workflow ||
      !currentWorkflowStateName ||
      currentWorkflowState?.is_final
    ) {
      return [];
    }

    return workflow.transitions
      .filter((transition) => {
        return transition.from === currentWorkflowStateName;
      })
      .map((transition) => ({
        id: `workflow-${transition.action}-${transition.from}`,
        label: transition.action,
        variant: "outline" as const,
        disabled: loading || saving || transitioning,
        onClick: () => {
          if (transition.action === "Cancel") {
            setPendingWorkflowAction(transition.action);
            return;
          }

          void handleWorkflowTransition(transition.action);
        },
      }));
  }, [
    mode,
    workflow,
    currentWorkflowStateName,
    currentWorkflowState,
    loading,
    saving,
    transitioning,
    handleWorkflowTransition,
  ]);

  const defaultActions = useMemo<GlobalToolbarAction[]>(
    () => [
      {
        id: "back",
        label: "Back",
        variant: "outline",
        disabled: saving || loading || transitioning,
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
    [
      saving,
      loading,
      transitioning,
      showSaveCancel,
      handleCancel,
      canSave,
      handleSubmit,
    ],
  );

  // GlobalToolbar renders actions, not its separate WorkflowActions component.
  // Convert transitions into its existing action format.
  const actions = [...(toolbarActions ?? defaultActions), ...workflowActions];

  const description =
    mode === "create"
      ? `Create a new ${doctype.name}`
      : mode === "view"
        ? `View ${String(documentValues.name ?? doctype.name)}`
        : `Edit ${String(documentValues.name ?? doctype.name)}`;

  const currentDocumentStatus =
    typeof documentValues.workflow_state === "string"
      ? documentValues.workflow_state
      : documentStatus;

  return (
    <section className="w-full min-w-0 space-y-4 p-4">
      <AlertDialog
        open={pendingWorkflowAction === "Cancel"}
        onOpenChange={(open) => {
          if (!open) setPendingWorkflowAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this document?</AlertDialogTitle>

            <AlertDialogDescription>
              This document will be permanently cancelled. You will not be able
              to reopen it or perform further workflow actions. Are you sure you
              want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Keep Document</AlertDialogCancel>

            <AlertDialogAction
              disabled={transitioning}
              onClick={(event) => {
                event.preventDefault();

                const action = pendingWorkflowAction;
                if (!action || transitioning) return;

                setPendingWorkflowAction(null);
                void handleWorkflowTransition(action);
              }}
            >
              {transitioning ? "Cancelling..." : "Yes, Cancel Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GlobalToolbar
        title={doctype.name}
        description={description}
        documentStatus={currentDocumentStatus}
        actions={actions}
      />

      {(error || submitError || transitionError) && (
        <div
          role="alert"
          className="whitespace-pre-line rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {transitionError ?? submitError ?? error}
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
                  saving ||
                  loading ||
                  transitioning ||
                  mode === "view" ||
                  !workflowAllowsEditing
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
