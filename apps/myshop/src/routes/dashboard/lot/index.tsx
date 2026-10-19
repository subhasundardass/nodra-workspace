import { useState } from "react";
import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { callMethod } from "@/lib/call-method";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import PageContainer from "@/components/layout/page-container";

type LotRecord = Record<string, unknown>;

type LotListData = {
  doctype: DocTypeDefinition;
  records: LotRecord[];
};

export const Route = createFileRoute("/dashboard/lot/")({
  loader: async (): Promise<LotListData> => {
    const [doctypeResult, result] = await Promise.all([
      callMethod<{ doctypes: DocTypeDefinition[] }>("nodra.doctypes"),
      callMethod<{ data: LotRecord[] }>("lots.list", {}),
    ]);

    const doctype = doctypeResult.doctypes.find((item) => item.name === "Lots");

    if (!doctype) {
      throw new Error('DocType "Lots" is not registered');
    }

    return {
      doctype,
      records: Array.isArray(result.data) ? result.data : [],
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate(values: Record<string, unknown>) {
    setSaving(true);
    setError(null);

    try {
      await callMethod("lots.create", { data: values });

      await navigate({
        to: "/dashboard/lot/new",
        search: { mode: undefined },
      });

      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create lot.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DocTypeListTemplate
      doctype={doctype}
      records={records}
      onCreate={() =>
        void navigate({
          to: "/dashboard/lot/new",
        })
      }
      onOpen={(name) =>
        void navigate({
          to: "/dashboard/lot/$name",
          params: { name },
        })
      }
    />
  );
}
