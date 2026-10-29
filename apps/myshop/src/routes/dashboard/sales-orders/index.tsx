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
  type TableColumns,
} from "@/features/sales-orders/columns";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  records: TableColumns[];
};

export const Route = createFileRoute("/dashboard/sales-orders/")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "SalesOrder",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "SalesOrder",
        fields: [
          "name",
          "order_date",
          "party",
          "sales_channel",
          "lot",
          "ordered_bags",
          "total_weight_kg",
          "total_amount",
          "workflow_state",
          "docstatus",
        ],
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "SalesOrder" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: (listResult.documents ?? []) as unknown as TableColumns[],
    };
  },

  component: SalesOrderListRoute,
});

function SalesOrderListRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const { table } = useDataTable({
    data: records,
    columns: createColumns((salesOrder) =>
      navigate({
        to: "/dashboard/sales-orders/$name",
        params: { name: salesOrder.name },
      }),
    ),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      title="Sales Orders"
      doctype={doctype}
      records={records}
      table={table}
      onCreate={() => navigate({ to: "/dashboard/sales-orders/new" })}
      onOpen={(name) =>
        navigate({
          to: "/dashboard/sales-orders/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
      pageSize={20}
    />
  );
}
