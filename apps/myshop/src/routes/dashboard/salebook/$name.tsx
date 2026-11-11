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
  saleBook: DocumentRecord;
  lot: DocumentRecord;
};

export const Route = createFileRoute("/dashboard/salebook/$name")({
  loader: async ({ params }): Promise<SaleEntryData> => {
    const [doctypeResult, saleResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "SaleBook",
      }),

      callMethod<{ document: DocumentRecord | null }>("document.get", {
        doctype: "SaleBook",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "SaleBook" is not registered.');
    }

    const saleBook = saleResult.document;

    if (!saleBook) {
      throw new Error(`SaleBook "${params.name}" was not found.`);
    }

    const lotId = String(saleBook.lot ?? "");

    if (!lotId) {
      throw new Error("SaleBook does not have a linked Lot.");
    }

    const lotResult = await callMethod<{
      document: DocumentRecord | null;
    }>("document.get", {
      doctype: "Lots",
      name: lotId,
    });

    const lot = lotResult.document;

    if (!lot) {
      throw new Error(`Lot "${lotId}" was not found.`);
    }

    console.log("Sale Entry Route:", {
      saleBookId: saleBook.name,
      lotId: lot.name,
      saleBook,
      lot,
    });

    return {
      doctype: doctypeResult.doctype,
      saleBook,
      lot,
    };
  },

  component: SaleEntryRoute,
});

function SaleEntryRoute() {
  const { doctype, saleBook, lot } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const lotBags = Number(lot.bags ?? 0);

  async function handleSubmit(values: FormValues): Promise<void> {
    const rate = Number(values.rate ?? 0);
    const soldBags = Number(values.sold_bags ?? 0);
    const soldQuantity = Number(values.sold_quantity ?? 0);

    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error("Selling Rate must be greater than zero.");
      return;
    }

    if (!Number.isFinite(soldBags) || soldBags <= 0) {
      toast.error("Sold Bags must be greater than zero.");
      return;
    }

    if (soldBags > lotBags) {
      toast.error("Sold Bags cannot exceed available Lot Bags.");
      return;
    }

    if (!Number.isFinite(soldQuantity) || soldQuantity <= 0) {
      toast.error("Sold KG must be greater than zero.");
      return;
    }

    const doc = {
      lot: String(lot.name),
      sale_date: values.sale_date,
      sale_type: values.sale_type,
      sold_bags: soldBags,
      sold_quantity: soldQuantity,
      rate,
      broker: values.broker || null,
      remarks: String(values.remarks ?? ""),
    };

    setSaving(true);

    try {
      await callMethod("document.update", {
        doctype: doctype.name,
        name: String(saleBook.name),
        doc,
      });

      toast.success("Sale Entry updated successfully.");

      await navigate({ to: "/dashboard/salebook" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update Sale Entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Edit Sale Entry"
      doctype={doctype}
      mode="edit"
      initialValues={{
        name: String(saleBook.name),
        workflow_state: String(saleBook.workflow_state ?? "Draft"),
        lot: String(lot.name),
        sale_date: saleBook.sale_date ?? new Date().toISOString().slice(0, 10),
        sale_type: saleBook.sale_type ?? "Bid",
        sold_bags: Number(saleBook.sold_bags ?? lot.bags ?? 0),
        sold_quantity: Number(
          saleBook.sold_quantity ??
            Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0),
        ),
        rate: Number(saleBook.rate ?? 0),
        broker: saleBook.broker ?? "",
        remarks: String(saleBook.remarks ?? ""),
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/salebook" })}
    >
      {(form) => <SaleEntryForm form={form} lot={lot} />}
    </DocTypeFormTemplate>
  );
}
