import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { StockTransferForm } from "@/features/inventory/stock-transfer/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/inventory/stock-transfer/new")(
  {
    loader: async (): Promise<DocTypeDefinition> => {
      const result = await callMethod<{
        doctype: DocTypeDefinition;
      }>("nodra.doctype.get", {
        name: "StockTransfer",
      });

      if (!result.doctype) {
        throw new Error('DocType "StockTransfer" is not registered.');
      }

      return result.doctype;
    },

    component: CreateStockTransferRoute,
  },
);

function CreateStockTransferRoute() {
  const doctype = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      await callMethod("document.create", {
        doctype: doctype.name,
        doc: values,
      });

      toast.success("Stock Transfer created successfully.");

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
      mode="create"
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/inventory/stock-transfer" })}
      initialValues={{
        transfer_date: new Date().toLocaleDateString("en-CA"),
        bags: 0,
        quantity: 0,
      }}
    >
      {(form) => <StockTransferForm form={form} />}
    </DocTypeFormTemplate>
  );
}
