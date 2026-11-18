import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import type { DocTypeDefinition } from "nodra";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { DiscountForm } from "@/features/master/discount/form";
import { callMethod } from "@/lib/call-method";

export const Route = createFileRoute("/dashboard/master/discount/new")({
  loader: async () => {
    const result = await callMethod<{ doctype: DocTypeDefinition }>(
      "nodra.doctype.get",
      {
        name: "DiscountTable",
      },
    );

    if (!result.doctype) {
      throw new Error("DiscountTable DocType not found");
    }

    return {
      doctype: result.doctype,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { doctype } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setSaving(true);

      await callMethod("document.create", {
        doctype: doctype.name,
        doc: {
          ...values,
          is_active: values.is_active ?? true,
          discount_rules: values.discount_rules ?? [],
        },
      });

      toast.success("Discount Table created successfully");

      await navigate({
        to: "/dashboard/master/discount",
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Discount Table",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocTypeFormTemplate
      title="Create Discount Table"
      doctype={doctype}
      mode="create"
      initialValues={{
        is_active: true,
        discount_rules: [],
      }}
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
