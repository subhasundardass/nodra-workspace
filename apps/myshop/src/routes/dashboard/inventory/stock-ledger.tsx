import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { callMethod } from "@/lib/call-method";
import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import {
  createColumns,
  type TableColumns,
} from "@/features/inventory/stock-ledger-columns";

type DocumentRecord = Record<string, unknown>;

export const Route = createFileRoute("/dashboard/inventory/stock-ledger")({
  loader: async () => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "StockLedger",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "StockLedger",
        fields: [
          "name",
          "posting_date",
          "lot",
          "lot.lot_no",
          "movement_type",
          "location_type",
          "factory",
          "factory.factory_name",
          "warehouse",
          "warehouse.title",
          "bags",
          "quantity",
          "voucher_type",
          "voucher_no",
          "remarks",
        ],
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "StockLedger" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: Array.isArray(listResult.documents) ? listResult.documents : [],
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { doctype, records } = Route.useLoaderData();

  const movements = records as unknown as TableColumns[];

  const { table } = useDataTable({
    data: movements,
    columns: createColumns(),
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  return (
    <DocTypeListTemplate
      title="Stock Ledger"
      showCreateButton={false}
      doctype={doctype}
      records={movements}
      table={table}
      onCreate={() => null}
      onRefresh={() => router.invalidate()}
      pageSize={20}
      totals={[
        { fieldname: "bags_in", label: "Total Bags In", align: "right" },
        { fieldname: "bags_out", label: "Total Bags Out", align: "right" },
        { fieldname: "quantity_in", label: "Total KG In", align: "right" },
        { fieldname: "quantity_out", label: "Total KG Out", align: "right" },
      ]}
    ></DocTypeListTemplate>
  );
}
