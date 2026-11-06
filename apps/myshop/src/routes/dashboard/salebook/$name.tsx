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
  saleBook: DocumentRecord | null;
  lot: DocumentRecord;
};

export const Route = createFileRoute("/dashboard/salebook/$name")({
  loader: async ({ params }): Promise<SaleEntryData> => {
    const [doctypeResult, lotResult, saleResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "SaleBook",
      }),

      callMethod<{ document: DocumentRecord | null }>("document.get", {
        doctype: "Lots",
        name: params.name,
      }),

      callMethod<{ document: DocumentRecord | null }>("salebook.get_by_lot", {
        lot: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "SaleBook" is not registered.');
    }

    const lot = lotResult.document;

    if (!lot) {
      throw new Error(`Lot "${params.name}" was not found.`);
    }

    const saleBook = saleResult.document;

    console.log("Sale Entry Route:", {
      routeLotId: params.name,
      lotId: lot.name,
      saleBookId: saleBook?.name ?? null,
      saleBook,
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
      if (saleBook?.name) {
        // Update the existing SaleBook document.
        await callMethod("document.update", {
          doctype: doctype.name,
          name: String(saleBook.name),
          doc,
        });

        toast.success("Sale Entry updated successfully.");
      } else {
        // Create the first SaleBook document for this Lot.
        await callMethod("document.create", {
          doctype: doctype.name,
          doc,
        });

        toast.success("Sale Entry created successfully.");
      }

      await navigate({ to: "/dashboard/salebook" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save Sale Entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title={saleBook ? "Edit Sale Entry" : "Create Sale Entry"}
      doctype={doctype}
      mode={saleBook ? "edit" : "create"}
      initialValues={{
        lot: String(lot.name),
        sale_date: saleBook?.sale_date ?? new Date().toISOString().slice(0, 10),
        sale_type: saleBook?.sale_type ?? "Bid",
        sold_bags: Number(saleBook?.sold_bags ?? lot.bags ?? 0),
        sold_quantity: Number(
          saleBook?.sold_quantity ??
            Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0),
        ),
        rate: Number(saleBook?.rate ?? 0),
        broker: saleBook?.broker ?? "",
        remarks: String(saleBook?.remarks ?? ""),
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/salebook" })}
    >
      {(form) => <SaleEntryForm form={form} lot={lot} />}
    </DocTypeFormTemplate>
  );
}
