import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { StockTransferForm } from "@/features/inventory/stock-transfer/form";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;
type FormValues = Record<string, unknown>;

type EditData = {
  doctype: DocTypeDefinition;
  document: DocumentRecord;
};

export const Route = createFileRoute(
  "/dashboard/inventory/stock-transfer/$name",
)({
  loader: async ({ params }): Promise<EditData> => {
    const [doctypeResult, documentResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "StockTransfer",
      }),
      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "StockTransfer",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "StockTransfer" is not registered.');
    }

    if (!documentResult.document) {
      throw new Error(`Stock Transfer "${params.name}" was not found.`);
    }

    return {
      doctype: doctypeResult.doctype,
      document: documentResult.document,
    };
  },

  component: EditStockTransferRoute,
});

function EditStockTransferRoute() {
  const { doctype, document } = Route.useLoaderData();
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      await callMethod("document.update", {
        doctype: doctype.name,
        name,
        doc: values,
      });

      toast.success("Stock Transfer updated successfully.");
      await navigate({
        to: "/dashboard/inventory/stock-transfer",
      });
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
      onCancel={() => navigate({ to: "/dashboard/inventory/stock-transfer" })}
    >
      {(form) => <StockTransferForm form={form} />}
    </DocTypeFormTemplate>
  );
}
