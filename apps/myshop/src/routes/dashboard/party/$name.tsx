import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { PartyForm } from "@/features/party/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;
type DocumentRecord = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/party/$name")({
  loader: async ({
    params,
  }): Promise<{
    doctype: DocTypeDefinition;
    doc: DocumentRecord;
  }> => {
    const [doctypeResult, docResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Party",
      }),
      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "Party",
        name: params.name,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Party" is not registered.');
    }

    if (!docResult.document) {
      throw new Error(`Party "${params.name}" was not found.`);
    }

    return {
      doctype: doctypeResult.doctype,
      doc: docResult.document,
    };
  },

  component: PartyDetailRoute,
});

function PartyDetailRoute() {
  const { doctype, doc } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      await callMethod("document.update", {
        doctype: doctype.name,
        name: doc.name,
        doc: values,
      });

      toast.success("Party updated successfully.");
      await navigate({ to: "/dashboard/party" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Edit Party"
      doctype={doctype}
      mode="edit"
      initialValues={doc}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/party" })}
    >
      {(form) => <PartyForm form={form} />}
    </DocTypeFormTemplate>
  );
}
