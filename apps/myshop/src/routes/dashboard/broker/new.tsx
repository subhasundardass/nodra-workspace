import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { BrokerForm } from "@/features/broker/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/broker/new")({
  loader: async (): Promise<DocTypeDefinition> => {
    const result = await callMethod<{ doctype: DocTypeDefinition }>(
      "nodra.doctype.get",
      { name: "Broker" },
    );

    if (!result.doctype) {
      throw new Error('DocType "Broker" is not registered.');
    }

    return result.doctype;
  },

  component: CreateBrokerRoute,
});

function CreateBrokerRoute() {
  const doctype = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      await callMethod("document.create", {
        doctype: doctype.name,
        doc: {
          ...values,
          is_active: values.is_active ?? true,
          workflow_state: "Draft",
        },
      });

      toast.success("Broker created successfully.");
      await navigate({ to: "/dashboard/broker" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Create Broker"
      doctype={doctype}
      mode="create"
      initialValues={{
        broker_type: "",
        is_active: true,
        workflow_state: "Draft",
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/broker" })}
    >
      {(form) => <BrokerForm form={form} />}
    </DocTypeFormTemplate>
  );
}
