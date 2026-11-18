import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { BrokerForm } from "@/features/broker/form";
import { callMethod } from "@/lib/call-method";
import { toast } from "sonner";
import { DocTypeDefinition } from "nodra/core/doctype/schema";

export const Route = createFileRoute("/dashboard/broker/$name")({
  loader: async ({ params }) => {
    const [doctypeResult, docResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Broker",
      }),
      callMethod<{ document: Record<string, unknown> }>("document.get", {
        doctype: "Broker",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error("Broker DocType not found");
    }

    if (!docResult.document) {
      throw new Error("Broker not found");
    }

    return {
      doctype: doctypeResult.doctype,
      doc: docResult.document,
    };
  },
  component: BrokerDetailRoute,
});

function BrokerDetailRoute() {
  const { doctype, doc } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSaving(true);

    try {
      await callMethod("document.update", {
        doctype: doctype.name,
        name: String(doc.name),
        doc: values,
      });

      toast.success("Broker updated successfully");

      navigate({ to: "/dashboard/broker" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update broker",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocTypeFormTemplate
      title="Edit Broker"
      doctype={doctype}
      mode="edit"
      initialValues={doc}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/broker" })}
    >
      {(form) => <BrokerForm form={form} />}
    </DocTypeFormTemplate>
  );
}
