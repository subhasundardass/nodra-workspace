import { useRouter } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import {
  createColumns,
  type TableColumns,
} from "@/features/inventory/stock-ledger-columns";

type DocumentRecord = Record<string, unknown>;

interface StockLedgerViewProps {
  doctype: DocTypeDefinition;
  records: DocumentRecord[];
}

export default function StockLedgerView({
  doctype,
  records,
}: StockLedgerViewProps) {
  const router = useRouter();

  const movements = records as unknown as TableColumns[];

  const { table } = useDataTable({
    data: movements,
    columns: createColumns(),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      title="Stock Ledger"
      doctype={doctype}
      records={movements}
      table={table}
      onRefresh={() => router.invalidate()}
    >
      <DataTable table={table} />
    </DocTypeListTemplate>
  );
}
