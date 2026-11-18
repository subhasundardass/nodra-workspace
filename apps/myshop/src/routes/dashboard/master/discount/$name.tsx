import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import type { DocTypeDefinition } from "nodra";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { DiscountForm } from "@/features/master/discount/form";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/master/discount/$name")({
  loader: async ({ params }) => {
    const [doctypeResult, documentResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "DiscountTable",
      }),
      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "DiscountTable",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error("DiscountTable DocType not found");
    }

    if (!documentResult.document) {
      throw new Error(`Discount Table "${params.name}" not found`);
    }

    return {
      doctype: doctypeResult.doctype,
      doc: documentResult.document,
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { doctype, doc } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);

    try {
      const {
        name,
        owner,
        creation,
        modified,
        modified_by,
        docstatus,
        idx,
        doctype: _doctype,
        ...updateData
      } = values;

      const discountRules = Array.isArray(updateData.discount_rules)
        ? updateData.discount_rules.map((rule) => {
            const { creation, modified, ...cleanRule } = rule as Record<
              string,
              unknown
            >;

            return cleanRule;
          })
        : [];

      await callMethod("document.update", {
        doctype: doctype.name,
        name: String(doc.name),
        doc: {
          ...updateData,
          discount_rules: discountRules,
        },
      });

      toast.success("Discount Table updated successfully");

      await navigate({
        to: "/dashboard/master/discount",
      });
    } catch (error) {
      console.error("Discount update error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update Discount Table",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocTypeFormTemplate
      title="Edit Discount Table"
      doctype={doctype}
      mode="edit"
      initialValues={doc}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() =>
        navigate({
          to: "/dashboard/master/discount",
        })
      }
    >
      {(form) => <DiscountForm form={form} />}
    </DocTypeFormTemplate>
  );
}
