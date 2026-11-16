import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";

import { createColumns } from "@/features/master/discount/columns";
import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";

interface DiscountTableRecord {
  name: string;
  title: string;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
  docstatus: number;
}

export const Route = createFileRoute("/dashboard/master/discount/")({
  loader: async () => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "DiscountTable",
      }),

      callMethod<{ documents: DiscountTableRecord[] }>("document.list", {
        doctype: "DiscountTable",
        fields: [
          "name",
          "title",
          "effective_from",
          "effective_to",
          "is_active",
          "docstatus",
        ],
        limit: 100,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "DiscountTable" is not registered.');
    }

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

  const columns = createColumns((name) =>
    navigate({
      to: "/dashboard/master/discount/$name",
      params: { name },
    }),
  );

  const { table } = useDataTable({
    data: records,
    columns,
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
      title="Discount Table"
      description="Manage buyer payment-based discount policies."
      doctype={doctype}
      records={records}
      table={table}
      onCreate={() =>
        navigate({
          to: "/dashboard/master/discount/new",
        })
      }
      onOpen={(name) =>
        navigate({
          to: "/dashboard/master/discount/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
      pageSize={20}
    />
  );
}
