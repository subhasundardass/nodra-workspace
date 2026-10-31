import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { callMethod } from "@/lib/call-method";
import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { OfferForm } from "@/features/offers/form";

import type { DocTypeDefinition } from "nodra";

interface LotRecord {
  name: string;
  lot_no?: string;
  factory?: string;
  grade?: string;
  original_brand?: string;
  warehouse?: string;
  bags?: number;
  bag_from_serial_no?: number;
  bag_to_serial_no?: number;
  net_kg_per_bag?: number;
  total_kg?: number;
  workflow_state?: string;
}

interface OfferLotRecord {
  lot: string;
  bags?: number;
  net_kg_per_bag?: number;
  total_kg?: number;
}

interface OfferFormValues extends Record<string, unknown> {
  offer_lots?: OfferLotRecord[];
}

function getLotTotalKg(lot: OfferLotRecord): number {
  if (lot.total_kg !== undefined && lot.total_kg !== null) {
    const totalKg = Number(lot.total_kg);

    if (Number.isFinite(totalKg)) {
      return totalKg;
    }
  }

  return Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0);
}

export const Route = createFileRoute("/dashboard/offers/new")({
  loader: async () => {
    const [doctypeResult, lotsResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "OfferSheet",
      }),

      callMethod<{ documents: LotRecord[] }>("document.list", {
        doctype: "Lots",
      }),
    ]);

    return {
      doctype: doctypeResult.doctype,
      lots: lotsResult.documents ?? [],
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { doctype, lots } = Route.useLoaderData();

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    navigate({
      to: "/dashboard/offers",
    });
  };

  const handleCreate = async (values: OfferFormValues) => {
    setSaving(true);

    try {
      const offerLots = Array.isArray(values.offer_lots)
        ? values.offer_lots
        : [];

      const totalBags = offerLots.reduce(
        (total, lot) => total + Number(lot.bags ?? 0),
        0,
      );

      const totalKg = offerLots.reduce(
        (total, lot) => total + getLotTotalKg(lot),
        0,
      );

      await callMethod("document.create", {
        doctype: "OfferSheet",
        doc: {
          ...values,
          total_bags: totalBags,
          total_kg: totalKg,
        },
      });

      toast.success("Offer Sheet created successfully.");

      navigate({
        to: "/dashboard/offers",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Offer Sheet.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocTypeFormTemplate
      title="New Offer Sheet"
      doctype={doctype}
      mode="create"
      initialValues={{
        offer_date: new Date().toISOString().slice(0, 10),
        broker_type: "PRIVATE",
        offer_lots: [],
        total_bags: 0,
        total_kg: 0,
        remarks: "",
      }}
      saving={saving}
      onSubmit={handleCreate}
      onCancel={handleCancel}
    >
      {(form) => <OfferForm form={form} lots={lots} />}
    </DocTypeFormTemplate>
  );
}
