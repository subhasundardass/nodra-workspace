import { useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";

import { callMethod } from "@/lib/call-method";
import { DispatchForm } from "@/features/dispatch/form";

type DocumentRecord = Record<string, unknown>;
type FormValues = Record<string, unknown>;

type DispatchData = {
  doctype: DocTypeDefinition;
  saleBook: DocumentRecord;
  dispatch: DocumentRecord | null;
};

export const Route = createFileRoute("/dashboard/dispatch/$name")({
  loader: async ({ params }): Promise<DispatchData> => {
    const [doctypeResult, saleBookResult, dispatchResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Dispatch",
      }),

      callMethod<{ document: DocumentRecord | null }>("document.get", {
        doctype: "SaleBook",
        name: params.name,
      }),

      callMethod<{ document: DocumentRecord | null }>(
        "dispatch.get_by_sale_book",
        {
          sale_book: params.name,
        },
      ),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Dispatch" is not registered.');
    }

    const saleBook = saleBookResult.document;

    if (!saleBook) {
      throw new Error(`SaleBook "${params.name}" was not found.`);
    }

    return {
      doctype: doctypeResult.doctype,
      saleBook,
      dispatch: dispatchResult.document,
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { doctype, dispatch, saleBook } = Route.useLoaderData();

  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const initialValues = {
    ...(dispatch ?? {}),

    sale_book: String(dispatch?.sale_book ?? saleBook.name ?? ""),
    sale_date: String(saleBook.sale_date ?? ""),
    lot_id: String(saleBook.lot ?? ""),

    dispatch_date: String(
      dispatch?.dispatch_date ?? new Date().toISOString().slice(0, 10),
    ),
    received_date: String(
      dispatch?.received_date ?? new Date().toISOString().slice(0, 10),
    ),
    party: String(dispatch?.party ?? saleBook.party ?? ""),
    broker: String(dispatch?.broker ?? saleBook.broker ?? ""),
    transporter: String(dispatch?.transporter ?? ""),

    payment_type: String(dispatch?.payment_type ?? "DUE"),
    discount_percentage:
      dispatch?.discount_percentage != null
        ? Number(dispatch.discount_percentage)
        : null,

    lr_number: String(dispatch?.lr_number ?? ""),
    challan_number: String(dispatch?.challan_number ?? ""),

    total_bags: Number(dispatch?.total_bags ?? saleBook.sold_bags ?? 0),
    total_kgs: Number(dispatch?.total_kgs ?? saleBook.sold_quantity ?? 0),

    remarks: String(dispatch?.remarks ?? ""),
    workflow_state: String(dispatch?.workflow_state ?? "Draft"),
  };

  async function handleSubmit(values: FormValues): Promise<void> {
    // 1. SaleBook validation
    if (!saleBook?.name) {
      toast.error("SaleBook reference is missing.");
      return;
    }

    // 2. Dispatch Date validation
    const dispatchDate = String(values.dispatch_date ?? "").trim();

    if (!dispatchDate) {
      toast.error("Please select a Dispatch Date.");
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dispatchDate) ||
      Number.isNaN(Date.parse(dispatchDate))
    ) {
      toast.error("Please enter a valid Dispatch Date.");
      return;
    }

    // 3. Party validation (manually selected)
    const party = String(values.party ?? "").trim();

    if (!party) {
      toast.error("Please select a Party.");
      return;
    }

    // 4. Payment Type validation
    const paymentType = String(values.payment_type ?? "");

    if (!["DUE", "DISCOUNT"].includes(paymentType)) {
      toast.error("Please select a valid Payment Type.");
      return;
    }

    // 5. Discount validation
    let discountPercentage: number | null = null;

    if (paymentType === "DISCOUNT") {
      if (
        values.discount_percentage === null ||
        values.discount_percentage === undefined ||
        String(values.discount_percentage).trim() === ""
      ) {
        toast.error("Please enter Discount Percentage.");
        return;
      }

      discountPercentage = Number(values.discount_percentage);

      if (
        !Number.isFinite(discountPercentage) ||
        discountPercentage <= 0 ||
        discountPercentage > 100
      ) {
        toast.error(
          "Discount Percentage must be greater than 0 and cannot exceed 100%.",
        );
        return;
      }
    }

    // 6. SaleBook quantity validation
    const totalBags = Number(saleBook.sold_bags ?? 0);
    const totalKgs = Number(saleBook.sold_quantity ?? 0);

    if (!Number.isFinite(totalBags) || totalBags <= 0) {
      toast.error("SaleBook must have valid sold bags.");
      return;
    }

    if (!Number.isFinite(totalKgs) || totalKgs <= 0) {
      toast.error("SaleBook must have valid sold quantity.");
      return;
    }

    // 7. Transporter (optional)
    const transporter = String(values.transporter ?? "").trim();

    // 8. Prepare Dispatch document
    const doc = {
      sale_book: String(saleBook.name),
      dispatch_date: dispatchDate,
      received_date: String(values.received_date ?? "").trim(),

      // Party is selected manually in Dispatch
      party,

      // Broker comes from SaleBook
      broker: saleBook.broker || null,

      transporter: transporter || null,

      lr_number: String(values.lr_number ?? "").trim(),
      challan_number: String(values.challan_number ?? "").trim(),

      // Quantities always come from SaleBook
      total_bags: totalBags,
      total_kgs: totalKgs,

      payment_type: paymentType,
      discount_percentage: discountPercentage,

      remarks: String(values.remarks ?? "").trim(),
      workflow_state: "Draft",
    };

    setSaving(true);

    try {
      if (dispatch?.name) {
        await callMethod("document.update", {
          doctype: doctype.name,
          name: String(dispatch.name),
          doc,
        });

        toast.success("Dispatch updated successfully.");
      } else {
        console.log("Dispatch payload:", JSON.stringify(doc, null, 2));
        await callMethod("document.create", {
          doctype: doctype.name,
          doc,
        });

        toast.success("Dispatch created successfully.");
      }

      await navigate({
        to: "/dashboard/dispatch",
      });
    } catch (error) {
      console.error("Dispatch save error:", error);

      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error properties:", Object.getOwnPropertyNames(error));

        const details = error as any;

        console.error("Validation details:", details.details);
        console.error("Validation errors:", details.errors);
        console.error("Response:", details.response);
        console.error("Cause:", details.cause);

        console.error(
          "Full error:",
          JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
        );
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to save Dispatch.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title={dispatch ? "Edit Dispatch" : "Create Dispatch"}
      doctype={doctype}
      mode={dispatch ? "edit" : "create"}
      initialValues={initialValues}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/dispatch" })}
    >
      {(form) => <DispatchForm form={form} />}
    </DocTypeFormTemplate>
  );
}
