import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { PartyForm } from "@/features/party/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;
type DocumentRecord = Record<string, unknown>;

type BrokerRecord = {
  name: string;
  title?: string;
  is_active?: boolean;
  docstatus?: number;
  city?: string;
  state?: string;
  phone?: string;
};

type BrokerOption = {
  name: string;
  title: string;
  city?: string;
  state?: string;
  phone?: string;
};

type PartyBrokerRow = {
  broker?: string;
};

type LoaderData = {
  doctype: DocTypeDefinition;
  doc: DocumentRecord;
  brokerOptions: BrokerOption[];
};

export const Route = createFileRoute("/dashboard/party/$name")({
  loader: async ({ params }): Promise<LoaderData> => {
    const [doctypeResult, docResult, brokerResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Party",
      }),

      callMethod<{ document: DocumentRecord }>("document.get", {
        doctype: "Party",
        name: params.name,
      }),

      callMethod<{ documents: BrokerRecord[] }>("document.list", {
        doctype: "Broker",
        fields: [
          "name",
          "title",
          "is_active",
          "docstatus",
          "city",
          "state",
          "phone",
        ],
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Party" is not registered.');
    }

    if (!docResult.document) {
      throw new Error(`Party "${params.name}" was not found.`);
    }

    const doc = docResult.document;

    const existingRows = Array.isArray(doc.brokers)
      ? (doc.brokers as PartyBrokerRow[])
      : [];

    const existingBrokerNames = new Set(
      existingRows
        .map((row) => row.broker)
        .filter((name): name is string => Boolean(name)),
    );

    const brokerOptions: BrokerOption[] = (brokerResult.documents ?? [])
      .filter(
        (broker) =>
          (broker.is_active === true && broker.docstatus !== 2) ||
          existingBrokerNames.has(broker.name),
      )
      .map((broker) => ({
        name: broker.name,
        title: broker.title || broker.name,
        city: broker.city,
        state: broker.state,
        phone: broker.phone,
      }));

    return {
      doctype: doctypeResult.doctype,
      doc,
      brokerOptions,
    };
  },

  component: PartyDetailRoute,
});

function PartyDetailRoute() {
  const { doctype, doc, brokerOptions } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: FormValues): Promise<void> {
    setSaving(true);

    try {
      const { name, owner, creation, modified, modified_by, ...doc } = values;

      const cleanedBrokers = Array.isArray(doc.brokers)
        ? doc.brokers.map((row) => {
            if (!row || typeof row !== "object") return row;

            const { creation, modified, owner, modified_by, ...broker } =
              row as Record<string, unknown>;

            return broker;
          })
        : doc.brokers;

      await callMethod("document.update", {
        doctype: doctype.name,
        name: String(name ?? doc.name ?? ""),
        doc: {
          ...doc,
          brokers: cleanedBrokers,
        },
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
      {(form) => <PartyForm form={form} brokers={brokerOptions} />}
    </DocTypeFormTemplate>
  );
}
