import { useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import { callMethod } from "@/lib/call-method";
import { formatDate } from "@/lib/format";
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

    dispatch_date: String(
      dispatch?.dispatch_date ?? new Date().toISOString().slice(0, 10),
    ),

    party: String(dispatch?.party ?? saleBook.party ?? ""),
    broker: String(dispatch?.broker ?? saleBook.broker ?? ""),
    transporter: String(dispatch?.transporter ?? ""),

    lr_number: String(dispatch?.lr_number ?? ""),
    challan_number: String(dispatch?.challan_number ?? ""),

    total_bags: Number(dispatch?.total_bags ?? saleBook.sold_bags ?? 0),

    total_kgs: Number(dispatch?.total_kgs ?? saleBook.sold_quantity ?? 0),

    remarks: String(dispatch?.remarks ?? ""),
    workflow_state: String(dispatch?.workflow_state ?? "Draft"),
  };

  async function handleSubmit(values: FormValues): Promise<void> {
    const doc = {
      sale_book: String(saleBook.name),
      dispatch_date: values.dispatch_date,
      party: String(saleBook.party ?? ""),
      broker: saleBook.broker || null,
      transporter: values.transporter || null,
      lr_number: String(values.lr_number ?? ""),
      challan_number: String(values.challan_number ?? ""),
      total_bags: Number(saleBook.sold_bags ?? 0),
      total_kgs: Number(saleBook.sold_quantity ?? 0),
      remarks: String(values.remarks ?? ""),
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
      console.error("Failed to save Dispatch:", error);

      toast.error(
        error instanceof Error ? error.message : "Failed to save Dispatch.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title={dispatch ? String(dispatch.name) : "Create Dispatch"}
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
