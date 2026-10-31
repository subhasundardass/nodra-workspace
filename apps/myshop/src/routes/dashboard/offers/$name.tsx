import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { callMethod } from "@/lib/call-method";
import { OfferForm } from "@/features/offers/form";

import {
  generateOfferPdf,
  type OfferPdfRow,
} from "@/features/offers/generate-offer-pdf";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";

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
};

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

      console.log("OFFER UPDATE VALUES:", updatedDoc);

      // Remove empty objects recursively.
      function cleanDocument(value: unknown): unknown {
        if (Array.isArray(value)) {
          return value.map(cleanDocument);
        }

        if (value && typeof value === "object") {
          const entries = Object.entries(value);

          if (entries.length === 0) return undefined;

          return Object.fromEntries(
            entries
              .map(([key, item]) => [key, cleanDocument(item)])
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

  function handleGenerateOffer() {
    try {
      const items = Array.isArray(doc.offer_lots)
        ? (doc.offer_lots as Record<string, unknown>[])
        : [];

      console.log("OFFER LOT ROW:", items[0]);

      Object.entries(doc).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          console.log(`CHILD TABLE: ${key}`, value);
        }
      });

      const rows: OfferPdfRow[] = items.map((item) => {
        const lot = lots.find((entry) => entry.name === String(item.lot ?? ""));

        const bags = Number(item.bags ?? lot?.bags ?? 0);
        const kgs = Number(item.kgs ?? 0);

        return {
          factory: String(lot?.factory ?? ""),
          lotNo: String(lot?.lot_no ?? ""),
          brand: String(lot?.original_brand ?? ""),
          grade: String(item.grade ?? lot?.grade ?? ""),
          bags,
          kgs,
          totalKg: bags * kgs,
          askingRate: Number(item.asking_rate ?? 0),
        };
      });

      if (rows.length === 0) {
        toast.error("No offer items found.");
        return;
      }

      generateOfferPdf({
        offerName: String(doc.name ?? "Offer"),
        offerDate: String(doc.offer_date ?? ""),
        rows,
      });

      toast.success("Offer PDF generated successfully.");
    } catch (error) {
      console.error("OFFER PDF ERROR:", error);
      toast.error("Failed to generate offer PDF.");
    }
  }

  const isConfirmed = doc.workflow_state === "Draft";

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
