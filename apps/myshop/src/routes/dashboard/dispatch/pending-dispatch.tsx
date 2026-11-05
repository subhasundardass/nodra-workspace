import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { DataTable } from "@/components/ui/table/data-table";

import type { DocTypeDefinition } from "nodra";
import {
  createColumns,
  type DispatchRecord,
} from "@/features/dispatch/columns";

import { DispatchForm } from "@/features/dispatch/form";

export const Route = createFileRoute("/dashboard/dispatch/pending-dispatch")({
  loader: async () => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Dispatch",
      }),
      callMethod<{ documents: DispatchRecord[] }>("dispatch.get_pending_list", {
        limit: 100,
        offset: 0,
      }),
    ]);

    return {
      doctype: doctypeResult.doctype,
      records: listResult.documents ?? [],
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { doctype, records } = Route.useLoaderData();

  const router = useRouter();

  const [selectedSaleBook, setSelectedSaleBook] = useState<string | null>(null);

  const openDispatch = (saleBook: string) => {
    setSelectedSaleBook(saleBook);
  };

  const { table } = useDataTable({
    data: records,
    columns: createColumns(openDispatch),
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  return (
    <>
      <DocTypeListTemplate
        title="Pending Dispatch"
        doctype={doctype}
        records={records}
        table={table}
        onCreate={() => null}
        onOpen={openDispatch}
        onRefresh={() => router.invalidate()}
        pageSize={20}
      >
        <DataTable table={table} />
      </DocTypeListTemplate>

      <DispatchForm
        open={!!selectedSaleBook}
        saleBook={selectedSaleBook}
        onOpenChange={(open) => {
          if (!open) setSelectedSaleBook(null);
        }}
        onSuccess={() => {
          setSelectedSaleBook(null);
          router.invalidate();
        }}
      />
    </>
  );
}
