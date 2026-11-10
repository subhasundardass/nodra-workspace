import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import type { DocTypeDefinition } from "nodra";

import { callMethod } from "@/lib/call-method";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { SaleEntryForm } from "@/features/salebook/form";

type DocumentRecord = Record<string, unknown>;
type SaleEntryValues = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/salebook/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    lot: typeof search.lot === "string" ? search.lot : "",
  }),

  loader: async () => {
    const result = await callMethod<{
      doctype: DocTypeDefinition;
    }>("nodra.doctype.get", {
      name: "SaleBook",
    });

    return {
      doctype: result.doctype,
    };
  },

  component: SaleEntryPage,
});

function getToday(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function SaleEntryPage() {
  const { doctype } = Route.useLoaderData();
  const { lot: initialLot } = Route.useSearch();

  const navigate = useNavigate();

  const [selectedLot, setSelectedLot] = useState(initialLot);
  const [lotDetails, setLotDetails] = useState<DocumentRecord>({});

  const [loadingLot, setLoadingLot] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lotError, setLotError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLot() {
      if (!selectedLot) {
        setLotDetails({});
        setLotError(null);
        setLoadingLot(false);
        return;
      }

      try {
        setLoadingLot(true);
        setLotError(null);
        setLotDetails({});

        const result = await callMethod<{
          document: DocumentRecord;
        }>("document.get", {
          doctype: "Lots",
          name: selectedLot,
        });

        const document = result.document;

        if (!document) {
          throw new Error("Lot not found.");
        }

        if (
          document.workflow_state !== "Confirmed" &&
          Number(document.docstatus) !== 51
        ) {
          throw new Error(
            "Only confirmed Lots can be selected for Sale Entry.",
          );
        }

        if (!cancelled) {
          setLotDetails(document);
        }
      } catch (error) {
        if (!cancelled) {
          setLotDetails({});
          setLotError(
            error instanceof Error
              ? error.message
              : "Unable to load Lot details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingLot(false);
        }
      }
    }

    void loadLot();

    return () => {
      cancelled = true;
    };
  }, [selectedLot]);

  async function handleSubmit(values: SaleEntryValues) {
    const lot = String(values.lot ?? "");

    if (!lot || !lotDetails.name) {
      toast.error("Please select a confirmed Lot.");
      return;
    }

    const bags = Number(values.sold_bags ?? 0);
    const quantity = Number(values.sold_quantity ?? 0);
    const rate = Number(values.rate ?? 0);

    const totalBags = Number(lotDetails.bags ?? 0);
    const totalKg = totalBags * Number(lotDetails.net_kg_per_bag ?? 0);

    if (bags <= 0 || bags > totalBags) {
      toast.error("Enter a valid Sold Bags quantity.");
      return;
    }

    if (quantity <= 0 || quantity > totalKg) {
      toast.error("Enter a valid Sold KG quantity.");
      return;
    }

    if (rate <= 0) {
      toast.error("Selling Rate must be greater than zero.");
      return;
    }

    if (!values.sale_date || !values.sale_type || !values.broker) {
      toast.error("Please complete all required Sale Details.");
      return;
    }

    try {
      setSaving(true);

      await callMethod("document.create", {
        doctype: doctype.name,
        doc: {
          ...values,
          lot,
          sold_bags: bags,
          sold_quantity: quantity,
          rate,
          workflow_state: "Draft",
        },
      });

      toast.success("Sale Entry created successfully.");

      await navigate({
        to: "/dashboard/salebook",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create Sale Entry.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Create Sale Entry"
      doctype={doctype}
      mode="create"
      initialValues={{
        lot: initialLot,
        sale_date: getToday(),
        sale_type: "Bid",
        broker: "",
        sold_bags: 0,
        sold_quantity: 0,
        rate: 0,
        remarks: "",
        workflow_state: "Draft",
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() =>
        navigate({
          to: "/dashboard/salebook",
        })
      }
    >
      {(form) => (
        <div className="space-y-3">
          <SaleEntryForm
            form={form}
            lot={lotDetails}
            onLotChange={setSelectedLot}
          />

          {loadingLot && (
            <p className="text-sm text-muted-foreground">
              Loading Lot details...
            </p>
          )}

          {lotError && <p className="text-sm text-destructive">{lotError}</p>}
        </div>
      )}
    </DocTypeFormTemplate>
  );
}
