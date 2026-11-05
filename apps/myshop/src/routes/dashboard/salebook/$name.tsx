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
  saleBook?: DocumentRecord;
};

export const Route = createFileRoute("/dashboard/salebook/$name")({
  loader: async ({ params }): Promise<SaleEntryData> => {
    const doctypeResult = await callMethod<{
      doctype: DocTypeDefinition;
    }>("nodra.doctype.get", {
      name: "SaleBook",
    });

    if (!doctypeResult.doctype) {
      throw new Error('DocType "SaleBook" is not registered.');
    }

    // Check for an existing SaleBook document.
    const saleBookResult = await callMethod<{
      document: DocumentRecord;
    }>("document.get", {
      doctype: "SaleBook",
      name: params.name,
    }).catch(() => null);

    const saleBook = saleBookResult?.document;

    // Existing SaleBook uses its linked Lot.
    // Otherwise, the route parameter is treated as a Lot name.
    const lotName = saleBook ? String(saleBook.lot) : params.name;

    const lotResult = await callMethod<{
      document: DocumentRecord;
    }>("document.get", {
      doctype: "Lots",
      name: lotName,
    });

    if (!lotResult.document) {
      throw new Error(`Lot "${lotName}" was not found.`);
    }

    if (lotResult.document.docstatus !== 51) {
      throw new Error("Only confirmed Lots can be sold.");
    }

    console.log("SaleBook loaded:", saleBook);

    return {
      doctype: doctypeResult.doctype,
      lot: lotResult.document,
      saleBook,
    };
  },

  component: SaleEntryRoute,
});

function SaleEntryRoute() {
  const { doctype, lot, saleBook } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const mode = saleBook ? "edit" : "create";

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      const doc = {
        lot: lot.name,
        sale_date: values.sale_date,
        sale_type: values.sale_type,
        rate:
          values.sale_rate === "" || values.sale_rate == null
            ? 0
            : Number(values.sale_rate),
        broker: values.broker || null,
        remarks: values.remarks || "",
      };

      if (saleBook) {
        await callMethod("document.update", {
          doctype: doctype.name,
          name: String(saleBook.name),
          doc,
        });

        toast.success("Sale Entry updated successfully.");
      } else {
        await callMethod("document.create", {
          doctype: doctype.name,
          doc,
        });

        toast.success("Sale Entry created successfully.");
      }

      await navigate({ to: "/dashboard/salebook" });
    } finally {
      setSaving(false);
    }
  }

  const initialValues = saleBook
    ? {
        ...saleBook,
        lot: lot.name,
        sale_date: saleBook.sale_date ?? "",
        sale_type: saleBook.sale_type ?? "Bid",
        broker: saleBook.broker ?? null,
        sale_rate: Number(saleBook.rate ?? 0),
        remarks: saleBook.remarks ?? "",
      }
    : {
        lot: lot.name,
        sale_date: new Date().toLocaleDateString("en-CA"),
        sale_type: "Bid",
        sold_bags: Number(lot.bags ?? 0),
        sold_quantity: Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0),
        broker: null,
        sale_rate: Number(lot.rate ?? 0),
        remarks: "",
      };

  return (
    <DocTypeFormTemplate
      title={mode === "edit" ? "Edit Sale Entry" : "Sale Entry"}
      doctype={doctype}
      mode={mode}
      initialValues={initialValues}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/salebook" })}
    >
      {(form) => <SaleEntryForm form={form} lot={lot} />}
    </DocTypeFormTemplate>
  );
}
