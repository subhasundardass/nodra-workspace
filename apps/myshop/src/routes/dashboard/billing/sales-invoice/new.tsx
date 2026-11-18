import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { SalesInvoiceForm } from "@/features/salesinvoice/create-invoice";
import { callMethod } from "@/lib/call-method";
import { DocTypeDefinition } from "nodra";

export const Route = createFileRoute("/dashboard/billing/sales-invoice/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    buyer: typeof search.buyer === "string" ? search.buyer : "",
    broker: typeof search.broker === "string" ? search.broker : "",
  }),

  loader: async () => {
    const result = await callMethod<{
      doctype: DocTypeDefinition;
    }>("nodra.doctype.get", {
      name: "SalesInvoice",
    });

    return {
      doctype: result.doctype,
    };
  },

  component: RouteComponent,
});

function getToday() {
  return new Date().toLocaleDateString("en-CA");
}

function RouteComponent() {
  const navigate = useNavigate();
  const { buyer, broker } = Route.useSearch();
  const [saving, setSaving] = useState(false);
  const { doctype } = Route.useLoaderData();

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);

    try {
      // Connect SalesInvoice create method here.
      console.log(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocTypeFormTemplate
      title="Create Sales Invoice"
      doctype={doctype}
      mode="create"
      initialValues={{
        buyer,
        broker,
        invoice_date: getToday(),
        billing_address: "",
        shipping_address: "",
        buyer_gstin: "",
        place_of_supply: "",
        items: [],
        total_bags: 0,
        total_kgs: 0,
        subtotal: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        igst_amount: 0,
        grand_total: 0,
        remarks: "",
        workflow_state: "Draft",
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() =>
        navigate({
          to: "/dashboard/billing/pending-invoices",
        })
      }
    >
      {(form) => <SalesInvoiceForm form={form} buyer={buyer} broker={broker} />}
    </DocTypeFormTemplate>
  );
}
