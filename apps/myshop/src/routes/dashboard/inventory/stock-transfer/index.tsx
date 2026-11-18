import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import {
  createColumns,
  type TableColumns,
} from "@/features/inventory/stock-transfer/columns";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  records: DocumentRecord[];
};

export const Route = createFileRoute("/dashboard/inventory/stock-transfer/")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "StockTransfer",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "StockTransfer",
        fields: [
          "name",
          "transfer_date",
          "lot",
          "lot.lot_no",
          "source_location_type",
          "source_factory",
          "source_factory.factory_name",
          "source_warehouse",
          "source_warehouse.title",
          "destination_location_type",
          "destination_factory",
          "destination_factory.factory_name",
          "destination_warehouse",
          "destination_warehouse.title",
          "bags",
          "quantity",
          "docstatus",
          "remarks",
        ],
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "StockTransfer" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: Array.isArray(listResult.documents) ? listResult.documents : [],
    };
  },

  component: StockTransferListRoute,
});

function StockTransferListRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const transfers = records as unknown as TableColumns[];

  const { table } = useDataTable({
    data: transfers,
    columns: createColumns((transfer) =>
      navigate({
        to: "/dashboard/inventory/stock-transfer/$name",
        params: { name: transfer.name },
      }),
    ),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      title="Stock Transfer"
      doctype={doctype}
      records={transfers}
      table={table}
      onCreate={() =>
        navigate({ to: "/dashboard/inventory/stock-transfer/new" })
      }
      onOpen={(name) =>
        navigate({
          to: "/dashboard/inventory/stock-transfer/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
      totals={[
        { fieldname: "bags", label: "Total Bags" },
        { fieldname: "quantity", label: "Total KG", decimals: 3 },
      ]}
    >
      {/* <DataTable table={table} /> */}
    </DocTypeListTemplate>
  );
}
