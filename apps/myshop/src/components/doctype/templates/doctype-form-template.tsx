import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getCurrentUser } from "@/lib/auth-current-user";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

type WorkflowState = {
  state: string;
  doc_status?: number;
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

type DocTypeFormTemplateProps = {
  title?: string;
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
    } else {
      values[fieldname] = field.default ?? "";
    }
  }

  // Preserve system fields and values not declared in the metadata.
  return { ...values, ...initialValues };
}

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "The operation could not be completed.";
  }

  if (
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "details" in error.data &&
    Array.isArray(error.data.details)
  ) {
    const messages = error.data.details
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

  return error.message;
}

function getTransitionSource(
  transition: WorkflowTransitionDefinition,
): string | undefined {
  return transition.from ?? transition.from_state;
}

function getTransitionRoles(
  transition: WorkflowTransitionDefinition,
): string[] {
  return transition.roles ?? transition.allowed_roles ?? [];
}

export function DocTypeFormTemplate({
  title,
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
  const workflow = (doctype as WorkflowDocType).workflow;

  const defaults = useMemo(
    () => getInitialValues(doctype, initialValues),
    [doctype, initialValues],
  );

  const [documentValues, setDocumentValues] = useState<FormValues>(defaults);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<
    string | null
  >(null);

  // null means roles are still loading.
  const [currentUserRoles, setCurrentUserRoles] = useState<string[] | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    void getCurrentUser()
      .then((user) => {
        if (active) {
          setCurrentUserRoles(user?.roles ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setCurrentUserRoles([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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

  const previousDefaultsKey = useRef(JSON.stringify(defaults));

  useEffect(() => {
    const defaultsKey = JSON.stringify(defaults);

    // Don't reset the form when only the object reference changes.
    if (previousDefaultsKey.current === defaultsKey) {
      return;
    }

    previousDefaultsKey.current = defaultsKey;

    setDocumentValues(defaults);
    form.reset(defaults);
    setSubmitError(null);
    setTransitionError(null);
  }, [defaults, form]);

  const currentWorkflowStateName = useMemo(() => {
    if (!workflow) return documentStatus;

    const stateValue = documentValues[workflow.state_field];

    if (typeof stateValue === "string" && stateValue.trim()) {
      return stateValue;
    }

    // Support callers that provide the workflow state or document status.
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

    const rawStatus = documentValues.docstatus;
    const numericStatus =
      typeof rawStatus === "number"
        ? rawStatus
        : typeof rawStatus === "string" && rawStatus.trim()
          ? Number(rawStatus)
          : undefined;

    if (numericStatus !== undefined && Number.isFinite(numericStatus)) {
      return workflow.states.find((state) => state.doc_status === numericStatus)
        ?.state;
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

  // Only the initial workflow state permits field editing.
  const workflowAllowsEditing =
    mode === "create" || !workflow || currentWorkflowState?.is_initial === true;

  const showSaveCancel = mode !== "view" && workflowAllowsEditing;

  const canSave = showSaveCancel && !loading && !saving && !transitioning;

  const handleSubmit = useCallback(() => {
    if (!canSave) return;
    void form.handleSubmit();
  }, [canSave, form]);

  const handleBack = useCallback(() => {
    if (!saving && !loading && !transitioning) {
      onCancel();
    }
  }, [saving, loading, transitioning, onCancel]);

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

        setDocumentValues(nextValues);
        form.reset(nextValues);
        await form.validateAllFields("change");
      } catch (err) {
        setTransitionError(getErrorMessage(err));
      } finally {
        setTransitioning(false);
      }
    },
    [documentValues.name, doctype, form, loading, saving, transitioning],
  );

  // Filter actions by both current state and the logged-in user's roles.
  // The server remains responsible for enforcing transition permissions.
  const workflowActions = useMemo<GlobalToolbarAction[]>(() => {
    if (
      mode === "create" ||
      !workflow ||
      !currentWorkflowStateName ||
      currentWorkflowState?.is_final === true ||
      currentUserRoles === null
    ) {
      return [];
    }

    return workflow.transitions
      .filter((transition) => {
        const fromState = getTransitionSource(transition);
        const allowedRoles = getTransitionRoles(transition);

        return (
          fromState === currentWorkflowStateName &&
          allowedRoles.some((role) => currentUserRoles.includes(role))
        );
      })
      .map((transition) => {
        const fromState = getTransitionSource(transition);

        return {
          id: `workflow-${transition.action}-${fromState}`,
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
        };
      });
  }, [
    mode,
    workflow,
    currentWorkflowStateName,
    currentWorkflowState,
    currentUserRoles,
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
        onClick: handleBack,
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
      canSave,
      showSaveCancel,
      handleBack,
      handleSubmit,
    ],
  );

  const actions = [...(toolbarActions ?? defaultActions), ...workflowActions];

  const description =
    mode === "create"
      ? `Create a new ${doctype.name}`
      : mode === "view"
        ? `View ${String(documentValues.name ?? doctype.name)}`
        : `Edit ${String(documentValues.name ?? doctype.name)}`;

  const currentDocumentStatusValue = workflow
    ? documentValues[workflow.state_field]
    : undefined;

  const currentDocumentStatus =
    typeof currentDocumentStatusValue === "string"
      ? currentDocumentStatusValue
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
              This document will be cancelled. If cancellation is irreversible
              in this workflow, you will not be able to reopen it or perform
              further workflow actions. Are you sure you want to continue?
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
        title={title ?? doctype.name}
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
          <div className="min-w-0 rounded-sm border bg-blue-50 p-6 dark:bg-muted/30 md:col-span-2">
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

          <aside className="flex min-w-0 flex-col overflow-hidden rounded-sm border bg-background md:sticky md:top-4 md:col-span-1 md:h-fit md:self-start">
            <div className="shrink-0 border-b bg-muted/20 px-4 py-3">
              <h2 className="text-sm font-semibold">Document Activity</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Recent document activity
              </p>
            </div>

            <div className="min-h-0">
              <ul className="divide-y">
                <li className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      AM
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">Amit Mondal</span>{" "}
                        <span className="text-muted-foreground">
                          updated the grade
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Grade: Assam CTC
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Oct 23, 2026 · 11:15 AM
                      </p>
                    </div>
                  </div>
                </li>

                <li className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      RK
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">Rahul Kumar</span>{" "}
                        <span className="text-muted-foreground">
                          changed the bag quantity
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Bags: 80 → 100
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Oct 23, 2026 · 11:42 AM
                      </p>
                    </div>
                  </div>
                </li>

                <li className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      SD
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">Subha Das</span>{" "}
                        <span className="text-muted-foreground">
                          changed the warehouse
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Warehouse: Siliguri Main Godown
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Oct 23, 2026 · 12:05 PM
                      </p>
                    </div>
                  </div>
                </li>

                <li className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      PB
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">Priya Biswas</span>{" "}
                        <span className="text-muted-foreground">
                          submitted this document
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Status: Draft → Pending
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Oct 23, 2026 · 12:30 PM
                      </p>
                    </div>
                  </div>
                </li>

                <li className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      AM
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">Amit Mondal</span>{" "}
                        <span className="text-muted-foreground">
                          added a remark
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Quality checked; awaiting final valuation.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Oct 23, 2026 · 1:10 PM
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default DocTypeFormTemplate;
