import StockLedgerView from "@/features/inventory/stock-ledger";
import { callMethod } from "@/lib/call-method";
import { createFileRoute } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

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
  const { doctype, records } = Route.useLoaderData();

  return <StockLedgerView doctype={doctype} records={records} />;
}
