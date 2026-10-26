import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { PartyForm } from "@/features/party/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/party/new")({
  loader: async (): Promise<DocTypeDefinition> => {
    const result = await callMethod<{ doctype: DocTypeDefinition }>(
      "nodra.doctype.get",
      { name: "Party" },
    );

    if (!result.doctype) {
      throw new Error('DocType "Party" is not registered.');
    }

    return result.doctype;
  },

  component: CreatePartyRoute,
});

function CreatePartyRoute() {
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

      toast.success("Party created successfully.");
      await navigate({ to: "/dashboard/party" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Create Party"
      doctype={doctype}
      mode="create"
      initialValues={{
        party_type: "Company",
        is_active: true,
        workflow_state: "Draft",
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/party" })}
    >
      {(form) => <PartyForm form={form} />}
    </DocTypeFormTemplate>
  );
}
