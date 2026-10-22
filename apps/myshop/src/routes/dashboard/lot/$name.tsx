import { useMemo, useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";
import type { WorkflowTransition } from "@/components/toolbar";
import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { LotForm } from "@/features/lots/form";
import { callMethod } from "@/lib/call-method";

type LotRecord = Record<string, unknown>;

type EditLotData = {
  doctype: DocTypeDefinition;
  lot: LotRecord;
};

export const Route = createFileRoute("/dashboard/lot/$name")({
  loader: async ({ params }): Promise<EditLotData> => {
    const [doctypeResult, lotResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Lots",
      }),
      callMethod<{ document: LotRecord }>("document.get", {
        doctype: "Lots",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    if (!lotResult.document) {
      throw new Error(`Lot "${params.name}" was not found.`);
    }

    return {
      doctype: doctypeResult.doctype,
      lot: lotResult.document,
    };
  },

  component: LotRoute,

  errorComponent: () => (
    <div className="space-y-2 p-4">
      <h2 className="font-semibold">Unable to load Lot form</h2>
      <p className="text-sm text-muted-foreground">
        The lot could not be loaded. Please return to the lot list and try
        again.
      </p>
    </div>
  ),
});

function LotRoute() {
  const { doctype, lot } = Route.useLoaderData();
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [saving, setSaving] = useState(false);
  const workflow = doctype.workflow;
  const stateField = workflow?.state_field;
  const currentState = stateField ? String(lot[stateField] ?? "") : "";

  async function handleWorkflowAction(action: string) {
    if (transitioning || saving) return;

    setTransitioning(true);

    try {
      await callMethod("document.transition", {
        doctype: doctype.name,
        name,
        action,
      });

      toast.success(`${action} completed successfully`);

      // Reload the document so the new workflow state is displayed.
      await router.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${action.toLowerCase()}`,
      );
    } finally {
      setTransitioning(false);
    }
  }

  const workflowTransitions = useMemo<WorkflowTransition[]>(() => {
    if (!workflow || !currentState) {
      return [];
    }

    return workflow.transitions
      .filter((transition) => transition.from === currentState)
      .map((transition) => ({
        id: transition.action,
        label: transition.action,
        disabled: transitioning || saving,
        onClick: () => {
          void handleWorkflowAction(transition.action);
        },
      }));
  }, [workflow, currentState, transitioning, saving]);

  async function handleSubmit(values: Record<string, unknown>) {
    setSaving(true);

    try {
      await callMethod("document.update", {
        doctype: doctype.name,
        name,
        doc: values,
      });

      toast.success("Lot updated successfully");

      await navigate({
        to: "/dashboard/lot",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;

    void navigate({
      to: "/dashboard/lot",
    });
  }

  return (
    <DocTypeFormTemplate
      doctype={doctype}
      mode="edit"
      initialValues={lot}
      saving={saving || transitioning}
      documentStatus={currentState || undefined}
      transitions={workflowTransitions}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    >
      {(form) => <LotForm form={form} />}
    </DocTypeFormTemplate>
  );
}
