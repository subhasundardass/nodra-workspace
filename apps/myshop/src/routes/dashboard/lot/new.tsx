import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { ArrowLeft, Save } from "lucide-react";

import { callMethod } from "@/lib/call-method";
import DocTypeFormTemplate from "@/components/doctype/templates/doctype-form-template";
import { LotFormFields } from "@/features/lots/form";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";

export const Route = createFileRoute("/dashboard/lot/new")({
  loader: async (): Promise<DocTypeDefinition> => {
    const result = await callMethod<{
      doctype: DocTypeDefinition;
    }>("nodra.doctype.get", {
      name: "Lots",
    });

    return result.doctype;
  },

  component: NewLotRoute,
});

function NewLotRoute() {
  const doctype = Route.useLoaderData();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  async function handleCreate(values: Record<string, unknown>) {
    setSaving(true);
    console.log("Updated form values:", values);

    try {
      await callMethod("lots.create", { data: values });
      await navigate({ to: "/dashboard/lot" });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    void navigate({ to: "/dashboard/lot" });
  }

  const toolbarActions: GlobalToolbarAction[] = [
    {
      id: "cancel",
      label: "Back",
      icon: ArrowLeft,
      variant: "outline",
      disabled: saving,
      onClick: handleCancel,
    },
    {
      id: "save",
      label: saving ? "Saving..." : "Save Lot",
      icon: Save,
      variant: "default",
      disabled: saving,
      onClick: () => {
        // The template owns the form submission handler.
        // Submit using the form's native submit event below.
        const formElement = document.getElementById(
          `doctype-form-${doctype.name}`,
        );

        if (formElement instanceof HTMLFormElement) {
          formElement.requestSubmit();
        }
      },
    },
  ];

  return (
    <DocTypeFormTemplate
      doctype={doctype}
      mode="create"
      saving={saving}
      toolbarActions={toolbarActions}
      onSubmit={handleCreate}
      onCancel={handleCancel}
    >
      {(form) => <LotFormFields form={form} />}
    </DocTypeFormTemplate>
  );
}
