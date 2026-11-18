import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";

import {
  createColumns,
  type PendingInvoiceGroup,
} from "@/features/salesinvoice/pending-invoice-columns";

export const Route = createFileRoute("/dashboard/billing/pending-invoices/")({
  loader: async () => {
    const listResult = await callMethod<{
      documents: PendingInvoiceGroup[];
      total_count: number;
      total_dispatch_count: number;
    }>("salesinvoice.get_pending_invoices", {
      limit: 100,
      offset: 0,
      sort_order: "asc",
    });

    return {
      records: listResult.documents ?? [],
      totalDispatchCount: listResult.total_dispatch_count ?? 0,
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { records } = Route.useLoaderData();

  const navigate = useNavigate();
  const router = useRouter();

  const openInvoiceGroup = (record: PendingInvoiceGroup) => {
    navigate({
      to: "/dashboard/billing/sales-invoice/new",
      search: {
        buyer: record.buyer,
        broker: record.broker,
      },
    });
  };

  const { table } = useDataTable({
    data: records,
    columns: createColumns(openInvoiceGroup),
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
      title="Pending Invoices"
      showCreateButton={false}
      records={records}
      table={table}
      onOpen={(name) => {
        const record = records.find((item) => item.name === name);

        if (record) openInvoiceGroup(record);
      }}
      onRefresh={() => router.invalidate()}
      pageSize={20}
      totals={[
        {
          fieldname: "dispatch_count",
          label: "Pending Dispatches",
          align: "right",
        },
        { fieldname: "total_bags", label: "Total Bags", align: "right" },
        {
          fieldname: "total_kgs",
          label: "Total Kgs",
          decimals: 2,
          align: "right",
        },
      ]}
    />
  );
}
