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

type DocumentRecord = Record<string, unknown>;
type FormValues = Record<string, unknown>;

type EditData = {
  doctype: DocTypeDefinition;
  document: DocumentRecord;
};

export const Route = createFileRoute("/dashboard/lot/$name")({
  loader: async ({ params }): Promise<EditData> => {
    const [doctypeResult, documentResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Lots",
      }),
      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "Lots",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    if (!documentResult.document) {
      throw new Error(`Lot "${params.name}" was not found.`);
    }

    return {
      doctype: doctypeResult.doctype,
      document: documentResult.document,
    };
  },

  component: EditLotRoute,
});

function EditLotRoute() {
  const { doctype, document } = Route.useLoaderData();
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      await callMethod("document.update", {
        doctype: doctype.name,
        name,
        doc: values,
      });

      toast.success("Lot updated successfully.");
      await navigate({ to: "/dashboard/lot" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      doctype={doctype}
      mode="edit"
      initialValues={document}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/lot" })}
    >
      {(form) => <LotForm form={form} />}
    </DocTypeFormTemplate>
  );
}
