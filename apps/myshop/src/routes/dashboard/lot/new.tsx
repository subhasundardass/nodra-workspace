import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import DocTypeFormTemplate from "@/components/doctype/templates/doctype-form-template";
import { LotForm } from "@/features/lots/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/lot/new")({
  loader: async (): Promise<DocTypeDefinition> => {
    const result = await callMethod<{
      doctype: DocTypeDefinition;
    }>("nodra.doctype.get", {
      name: "Lots",
    });

    if (!result.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    return result.doctype;
  },

  component: NewLotRoute,
});

function NewLotRoute() {
  const doctype = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleCreate(values: FormValues) {
    setSaving(true);

    try {
      await callMethod("document.create", {
        doctype: doctype.name,
        doc: values,
      });

      await navigate({
        to: "/dashboard/lot",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;

    void navigate({
      to: "/dashboard/lot",
    });
  }

  return (
    <DocTypeFormTemplate
      doctype={doctype}
      mode="create"
      saving={saving}
      onSubmit={handleCreate}
      onCancel={handleCancel}
    >
      {(form) => <LotForm form={form} />}
    </DocTypeFormTemplate>
  );
}
