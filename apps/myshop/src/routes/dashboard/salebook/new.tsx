import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { SaleEntryForm } from "@/features/salebook/form";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;
type SaleEntryValues = Record<string, unknown>;

async function validateAndGetLot(lotName: string): Promise<DocumentRecord> {
  const result = await callMethod<{
    document: DocumentRecord | null;
  }>("document.get", {
    doctype: "Lots",
    name: lotName,
  });

  const document = result.document;

  if (!document) {
    throw new Error("Lot not found.");
  }

  if (
    document.workflow_state !== "Confirmed" &&
    Number(document.docstatus) !== 51
  ) {
    throw new Error("Only confirmed Lots can be selected for Sale Entry.");
  }

  const stock = await callMethod<{
    factory_bags: number;
    factory_quantity: number;
    warehouse_bags: number;
    warehouse_quantity: number;
  }>("stock.get_lot_balance", { lot: lotName });

  if (stock.factory_bags <= 0 || stock.factory_quantity <= 0) {
    throw new Error("This Lot does not have available stock in Factory.");
  }

  if (stock.warehouse_bags > 0 || stock.warehouse_quantity > 0) {
    throw new Error(
      "This Lot is in Warehouse and cannot be selected for Sale Entry.",
    );
  }

  const saleBookEntries = await callMethod<{
    documents: DocumentRecord[];
  }>("salebook.get_by_lot", { lot: lotName });

  const hasCancelledEntry = saleBookEntries.documents.some(
    (entry) => entry.workflow_state === "Cancelled",
  );

  if (hasCancelledEntry) {
    throw new Error(
      "This Lot has a cancelled Sale Entry. Please contact the administrator.",
    );
  }

  return document;
}

export const Route = createFileRoute("/dashboard/salebook/new")({
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
  const navigate = useNavigate();

  const [selectedLot, setSelectedLot] = useState("");
  const [lotDetails, setLotDetails] = useState<DocumentRecord>({});
  const [loadingLot, setLoadingLot] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lotError, setLotError] = useState<string | null>(null);

  async function handleLotChange(lotName: string): Promise<boolean> {
    if (!lotName) {
      setSelectedLot("");
      setLotDetails({});
      setLotError(null);
      return true;
    }

    try {
      setLoadingLot(true);
      setLotError(null);
      setLotDetails({});

      const document = await validateAndGetLot(lotName);

      setSelectedLot(lotName);
      setLotDetails(document);

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to validate Lot.";

      setSelectedLot("");
      setLotDetails({});
      setLotError(message);
      toast.error(message);

      return false;
    } finally {
      setLoadingLot(false);
    }
  }

  async function handleSubmit(values: SaleEntryValues) {
    const lot = String(values.lot ?? "");

    if (!lot || !lotDetails.name || lot !== selectedLot) {
      toast.error("Please select a valid confirmed Lot.");
      return;
    }

    const isConfirmed =
      Number(lotDetails.docstatus) === 51 ||
      String(lotDetails.workflow_state ?? "").toLowerCase() === "confirmed";

    if (!isConfirmed) {
      toast.error("Only confirmed Lots can be used for Sale Entry.");
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
        lot: "",
        sale_date: getToday(),
        sale_type: "Advance",
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
            onLotChange={handleLotChange}
            loadingLot={loadingLot}
          />

          {lotError && <p className="text-sm text-destructive">{lotError}</p>}
        </div>
      )}
    </DocTypeFormTemplate>
  );
}
