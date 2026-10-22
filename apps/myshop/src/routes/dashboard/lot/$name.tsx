import { useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

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
      callMethod<{ doctypes: DocTypeDefinition[] }>("nodra.doctypes"),
      callMethod<{ document: LotRecord }>("document.get", {
        doctype: "Lots",
        name: params.name,
      }),
    ]);

    const doctype = doctypeResult.doctypes.find((item) => item.name === "Lots");

    if (!doctype) {
      throw new Error('DocType "Lots" is not registered');
    }

    if (!lotResult.document) {
      throw new Error(`Lot "${params.name}" was not found`);
    }

    return {
      doctype,
      lot: lotResult.document,
    };
  },

  component: LotRoute,

  errorComponent: ({ error }) => (
    <div className="space-y-2 p-4">
      <h2 className="font-semibold">Unable to load Lot form</h2>
      {/* <pre className="whitespace-pre-wrap text-sm text-destructive">
        {error.message}
      </pre> */}
    </div>
  ),
});

function LotRoute() {
  const { doctype, lot } = Route.useLoaderData();
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: Record<string, unknown>) {
    setSaving(true);

    try {
      await callMethod("document.update", {
        doctype: "Lots",
        name,
        doc: values,
      });

      toast.success("Lot updated successfully");

      await router.invalidate();

      await navigate({
        to: "/dashboard/lot",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update lot",
      );

      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      doctype={doctype}
      mode="edit"
      initialValues={lot}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() =>
        void navigate({
          to: "/dashboard/lot",
        })
      }
    >
      {(form) => <LotForm form={form} />}
    </DocTypeFormTemplate>
  );
}
