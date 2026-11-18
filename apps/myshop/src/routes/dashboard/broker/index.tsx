import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { useDataTable } from "@/hooks/use-data-table";
import { createColumns, type TableColumns } from "@/features/broker/columns";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  records: TableColumns[];
};

export const Route = createFileRoute("/dashboard/broker/")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Broker",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "Broker",
        fields: [
          "name",
          "title",
          "broker_type",
          "contact_person",
          "phone",
          "email",
          "city",
          "state",
          "is_active",
          "workflow_state",
          "docstatus",
        ],
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Broker" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: (listResult.documents ?? []) as unknown as TableColumns[],
    };
  },

  component: BrokerListRoute,
});

function BrokerListRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const { table } = useDataTable({
    data: records,
    columns: createColumns((broker) =>
      navigate({
        to: "/dashboard/broker/$name",
        params: { name: broker.name },
      }),
    ),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      title="Broker Master"
      doctype={doctype}
      records={records}
      table={table}
      onCreate={() => navigate({ to: "/dashboard/broker/new" })}
      onOpen={(name) =>
        navigate({
          to: "/dashboard/broker/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
      pageSize={20}
    />
  );
}
