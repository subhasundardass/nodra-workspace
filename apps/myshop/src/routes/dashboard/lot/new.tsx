import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { callMethod } from "@/lib/call-method";
import { LotForm } from "@/features/lots/form";
import DocTypeFormTemplate from "@/components/doctype/templates/doctype-form-template";

export const Route = createFileRoute("/dashboard/lot/new")({
  loader: async (): Promise<DocTypeDefinition> => {
    const result = await callMethod<{ doctypes: DocTypeDefinition[] }>(
      "nodra.doctypes",
    );

    const doctype = result.doctypes.find((item) => item.name === "Lots");

    if (!doctype) {
      throw new Error('DocType "Lot" is not registered');
    }

    return doctype;
  },

  component: NewLotRoute,
});

function NewLotRoute() {
  const doctype = Route.useLoaderData();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  async function handleCreate(values: Record<string, unknown>) {
    setSaving(true);

    try {
      await callMethod("lots.create", { data: values });

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
      onSubmit={handleCreate}
      onCancel={() => void navigate({ to: "/dashboard/lot" })}
      visibleFields={["lot_no", "brand", "grade", "bags", "kgs", "rate"]}
    />
  );
}
