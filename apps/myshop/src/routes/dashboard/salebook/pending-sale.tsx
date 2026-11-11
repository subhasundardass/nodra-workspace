import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { useDataTable } from "@/hooks/use-data-table";
import {
  createColumns,
  type SaleBookRecord,
} from "@/features/salebook/columns";
import { callMethod } from "@/lib/call-method";

type ListData = {
  doctype: DocTypeDefinition;
  records: SaleBookRecord[];
};

export const Route = createFileRoute("/dashboard/salebook/pending-sale")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "SaleBook",
      }),
      callMethod<{ documents: SaleBookRecord[] }>("salebook.get_pending_lots", {
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "SaleBook" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: listResult.documents ?? [],
    };
  },

  component: PendingSaleRoute,
});

function PendingSaleRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const openLot = (lot: string) =>
    navigate({
      to: "/dashboard/salebook/new",
      search: { lot },
    });

  const { table } = useDataTable({
    data: records,
    columns: createColumns(openLot),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      doctype={doctype}
      title="Pending Sale"
      description={`${records.length} lots pending sale entry`}
      records={records}
      table={table}
      onOpen={openLot}
      onRefresh={() => router.invalidate()}
    />
  );
}
