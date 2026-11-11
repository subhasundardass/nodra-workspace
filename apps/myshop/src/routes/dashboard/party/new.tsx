import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { PartyForm } from "@/features/party/form";
import { callMethod } from "@/lib/call-method";

type FormValues = Record<string, unknown>;

type BrokerRecord = {
  name: string;
  title: string;
  is_active: boolean;
  docstatus?: number;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
};

type BrokerOption = {
  name: string;
  title: string;
};

type LoaderData = {
  doctype: DocTypeDefinition;
  brokerOptions: BrokerOption[];
};

export const Route = createFileRoute("/dashboard/party/new")({
  loader: async (): Promise<LoaderData> => {
    const [doctypeResult, brokerResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Party",
      }),

      callMethod<{ documents: BrokerRecord[] }>("document.list", {
        doctype: "Broker",
        fields: [
          "name",
          "title",
          "is_active",
          "docstatus",
          "contact_person",
          "phone",
          "email",
          "address",
          "city",
          "state",
          "pin",
        ],
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Party" is not registered.');
    }

    const brokerOptions: BrokerOption[] = (brokerResult.documents ?? [])
      .filter((broker) => broker.is_active === true && broker.docstatus !== 51)
      .map((broker) => ({
        name: broker.name,
        title: broker.title || broker.name,
        city: broker.city,
        state: broker.state,
        phone: broker.phone,
      }));

    return {
      doctype: doctypeResult.doctype,
      brokerOptions,
    };
  },

  component: CreatePartyRoute,
});

function CreatePartyRoute() {
  const { doctype, brokerOptions } = Route.useLoaderData();
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

      toast.success("Buyer created successfully.");
      await navigate({ to: "/dashboard/party" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeFormTemplate
      title="Create Buyer"
      doctype={doctype}
      mode="create"
      initialValues={{
        title: "",
        party_type: "Company",
        is_active: true,
        workflow_state: "Draft",
        brokers: [
          {
            broker: "",
            commission_rate: undefined,
            notes: "",
          },
        ],
      }}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate({ to: "/dashboard/party" })}
    >
      {(form) => <PartyForm form={form} brokers={brokerOptions} />}
    </DocTypeFormTemplate>
  );
}
