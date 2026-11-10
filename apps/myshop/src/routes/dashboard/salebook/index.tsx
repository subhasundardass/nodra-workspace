import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";

import type { DocTypeDefinition } from "nodra";
import {
  createColumns,
  type SaleBookRecord,
} from "@/features/salebook/columns";

export const Route = createFileRoute("/dashboard/salebook/")({
  loader: async () => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "SaleBook",
      }),
      callMethod<{ documents: SaleBookRecord[] }>("salebook.get_list", {
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

  const openSaleBook = (name: string) =>
    navigate({
      to: "/dashboard/salebook/$name",
      params: { name },
    });

  const createSaleBook = () =>
    navigate({
      to: "/dashboard/salebook/new",
      search: {
        lot: "",
      },
    });

  const { table } = useDataTable({
    data: records,
    columns: createColumns(openSaleBook),
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
      title="Sale Book"
      showCreateButton={true}
      createButtonLabel="Create Sale Entry"
      doctype={doctype}
      records={records}
      table={table}
      onCreate={createSaleBook}
      onOpen={openSaleBook}
      onRefresh={() => router.invalidate()}
      pageSize={20}
    />
  );
}
