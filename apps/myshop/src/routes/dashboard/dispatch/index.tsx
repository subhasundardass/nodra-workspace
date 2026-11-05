import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { DataTable } from "@/components/ui/table/data-table";

import type { DocTypeDefinition } from "nodra";
import {
  createColumns,
  type DispatchRecord,
} from "@/features/dispatch/columns";

export const Route = createFileRoute("/dashboard/dispatch/")({
  loader: async () => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Dispatch",
      }),
      callMethod<{ documents: DispatchRecord[] }>("dispatch.get_list", {
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

  const navigate = useNavigate();
  const router = useRouter();

  const openDispatch = (name: string) =>
    navigate({
      to: "/dashboard/dispatch/$name",
      params: { name },
    });

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
    <DocTypeListTemplate
      title="Dispatch"
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
  );
}
