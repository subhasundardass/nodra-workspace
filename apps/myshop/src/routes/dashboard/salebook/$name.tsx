import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { SaleEntryForm } from "@/features/salebook/form";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;
type FormValues = Record<string, unknown>;

type SaleEntryData = {
  doctype: DocTypeDefinition;
  lot: DocumentRecord;
};

export const Route = createFileRoute("/dashboard/salebook/$name")({
  loader: async ({ params }): Promise<SaleEntryData> => {
    const [doctypeResult, lotResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "SaleBook",
      }),
      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "Lots",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "SaleEntry" is not registered.');
    }

    if (!lotResult.document) {
      throw new Error(`Lot "${params.name}" was not found.`);
    }

    if (lotResult.document.docstatus !== 51) {
      throw new Error("Only confirmed Lots can be sold.");
    }

    return {
      doctype: doctypeResult.doctype,
      lot: lotResult.document,
    };
  },

  component: SaleEntryRoute,
});

function SaleEntryRoute() {
  const { doctype, lot } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);
    console.log("Sale Entry values:", values);
    try {
      await callMethod("document.create", {
        doctype: doctype.name,
        doc: {
          lot: lot.name,
          sale_date: values.sale_date,
          sale_type: values.sale_type,
          rate: Number(values.sale_rate ?? values.rate ?? 0),
          broker: values.broker || null,
          remarks: values.remarks || "",
        },
      });

      toast.success("Sale Entry created successfully.");

      await navigate({ to: "/dashboard/salebook" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Sale Entry"
      doctype={doctype}
      mode="create"
      initialValues={{
        lot: lot.name,
        sale_date: new Date().toLocaleDateString("en-CA"),
        sale_type: "Bid",
        sold_bags: Number(lot.bags ?? 0),
        sold_quantity: Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0),
        sale_rate: Number(lot.rate ?? 0),
        remarks: "",
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/salebook" })}
    >
      {(form) => <SaleEntryForm form={form} lot={lot} />}
    </DocTypeFormTemplate>
  );
}
