import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { useDataTable } from "@/hooks/use-data-table";
import { createColumns, type TableColumns } from "@/features/party/columns";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  records: TableColumns[];
};

export const Route = createFileRoute("/dashboard/party/")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Party",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "Party",
        fields: [
          "name",
          "title",
          "party_type",
          "is_supplier",
          "is_buyer",
          "is_agent",
          "is_tea_owner",
          "is_transporter",
          "phone",
          "email",
          "is_active",
          "workflow_state",
          "docstatus",
        ],
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Party" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: (listResult.documents ?? []) as unknown as TableColumns[],
    };
  },

  component: PartyListRoute,
});

function PartyListRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const { table } = useDataTable({
    data: records,
    columns: createColumns((party) =>
      navigate({
        to: "/dashboard/party/$name",
        params: { name: party.name },
      }),
    ),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      title="Party Master"
      doctype={doctype}
      records={records}
      table={table}
      onCreate={() => navigate({ to: "/dashboard/party/new" })}
      onOpen={(name) =>
        navigate({
          to: "/dashboard/party/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
      pageSize={20}
    />
  );
}
