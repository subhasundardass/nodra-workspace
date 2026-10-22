import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { callMethod } from "@/lib/call-method";

type LotRecord = Record<string, unknown>;

type LotListData = {
  doctype: DocTypeDefinition;
  records: LotRecord[];
};

export const Route = createFileRoute("/dashboard/lot/")({
  loader: async (): Promise<LotListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Lots",
      }),
      callMethod<{ documents: LotRecord[] }>("document.list", {
        doctype: "Lots",
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: Array.isArray(listResult.documents) ? listResult.documents : [],
    };
  },

  component: LotListRoute,
});

function LotListRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();

  function handleCreate() {
    void navigate({
      to: "/dashboard/lot/new",
    });
  }

  function handleOpen(name: string) {
    void navigate({
      to: "/dashboard/lot/$name",
      params: { name },
    });
  }

  return (
    <DocTypeListTemplate
      doctype={doctype}
      records={records}
      onCreate={handleCreate}
      onOpen={handleOpen}
    />
  );
}
