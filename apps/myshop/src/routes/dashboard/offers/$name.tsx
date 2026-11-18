import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";
import { OfferForm } from "@/features/offers/form";
import { generateOfferPdf } from "@/features/offers/generate-offer-pdf";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;
type DocumentRecord = Record<string, unknown>;

type LotRecord = {
  name: string;
  lot_no?: string;
  factory?: string;
  grade?: string;
  original_brand?: string;
  warehouse?: string;
  bags?: number;
  total_kg?: number;
  remarks: string;
};

type OfferItem = Record<string, unknown>;

type LoaderData = {
  doctype: DocTypeDefinition;
  doc: DocumentRecord;
  lots: LotRecord[];
};

export const Route = createFileRoute("/dashboard/offers/$name")({
  loader: async ({ params }): Promise<LoaderData> => {
    const [doctypeResult, docResult, lotResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "OfferSheet",
      }),

      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "OfferSheet",
        name: params.name,
      }),

      callMethod<{ documents: LotRecord[] }>("document.list", {
        doctype: "Lots",
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "OfferSheet" is not registered.');
    }

    if (!docResult.document) {
      throw new Error(`Offer "${params.name}" was not found.`);
    }

    return {
      doctype: doctypeResult.doctype,
      doc: docResult.document,
      lots: lotResult.documents ?? [],
    };
  },

  component: OfferDetailRoute,
});

function OfferDetailRoute() {
  const { doctype, doc, lots } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      const { name, owner, creation, modified, modified_by, ...updatedDoc } =
        values;

      // Remove empty objects recursively before updating the document.
      function cleanDocument(value: unknown): unknown {
        if (Array.isArray(value)) {
          return value.map(cleanDocument).filter((item) => item !== undefined);
        }

        if (value && typeof value === "object") {
          const entries = Object.entries(value);

          if (entries.length === 0) return undefined;

          return Object.fromEntries(
            entries
              .map(([key, item]) => [key, cleanDocument(item)] as const)
              .filter(([, item]) => item !== undefined),
          );
        }

        return value;
      }

      const cleanedDoc = cleanDocument(updatedDoc);

      await callMethod("document.update", {
        doctype: doctype.name,
        name: String(name ?? doc.name ?? ""),
        doc: cleanedDoc,
      });

      toast.success("Offer updated successfully.");
      await navigate({ to: "/dashboard/offers" });
    } catch (error) {
      console.error("OFFER UPDATE ERROR:", error);
      toast.error("Failed to update offer.");
    } finally {
      setSaving(false);
    }
  }

  function getOfferPdfRows() {
    const items = Array.isArray(doc.offer_lots)
      ? (doc.offer_lots as OfferItem[])
      : [];

    return items.map((item) => {
      const lot = lots.find((entry) => entry.name === String(item.lot ?? ""));

      const bags = Number(item.bags ?? lot?.bags ?? 0);
      const kgs = Number(item.net_kg_per_bag ?? 0);
      const totalKg = Number(item.total_kg ?? 0);

      return {
        factory:
          String(item.factory ?? lot?.factory ?? "").trim() ||
          "Unspecified Factory",
        lotNo: String(item.lot_no ?? lot?.lot_no ?? ""),
        brand: String(item.original_brand ?? lot?.original_brand ?? ""),
        grade: String(item.grade ?? lot?.grade ?? ""),
        bags,
        kgs,
        totalKg,
        askingRate: Number(item.asking_rate ?? 0),
        remarks: String(item.remarks ?? ""),
      };
    });
  }

  function handleGenerateOffer(): void {
    try {
      const rows = getOfferPdfRows();

      if (rows.length === 0) {
        toast.error("No offer items found.");
        return;
      }

      const offerName = String(doc.name ?? "Offer");

      generateOfferPdf({
        offerName,
        offerDate: String(doc.offer_date ?? ""),
        rows,
      });

      toast.success("Offer PDF generated successfully.");
    } catch (error) {
      console.error("OFFER PDF ERROR:", error);
      toast.error("Failed to generate offer PDF.");
    }
  }

  const isConfirmed = doc.workflow_state === "Confirmed";

  const offerActions: GlobalToolbarAction[] = isConfirmed
    ? [
        {
          id: "generate-offer",
          label: "Generate Offer",
          variant: "outline",
          onClick: handleGenerateOffer,
        },
        {
          id: "print-sheet",
          label: "Print Sheet",
          variant: "outline",
          onClick: () => {},
        },
      ]
    : [];

  return (
    <DocTypeFormTemplate
      title="Edit Offer"
      doctype={doctype}
      mode="edit"
      initialValues={doc}
      saving={saving}
      toolbarActions={offerActions}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/offers" })}
    >
      {(form) => <OfferForm form={form} lots={lots} />}
    </DocTypeFormTemplate>
  );
}
