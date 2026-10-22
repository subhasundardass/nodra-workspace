import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { LotForm } from "@/features/lots/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/lot/new")({
  loader: async (): Promise<DocTypeDefinition> => {
    const result = await callMethod<{
      doctype: DocTypeDefinition;
    }>("nodra.doctype.get", { name: "Lots" });

    if (!result.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    return result.doctype;
  },

  component: CreateLotRoute,
});

function CreateLotRoute() {
  const doctype = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      await callMethod("document.create", {
        doctype: doctype.name,
        doc: values,
      });

      toast.success("Lot created successfully.");
      await navigate({ to: "/dashboard/lot" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      doctype={doctype}
      mode="create"
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/lot" })}
    >
      {(form) => <LotForm form={form} />}
    </DocTypeFormTemplate>
  );
}
