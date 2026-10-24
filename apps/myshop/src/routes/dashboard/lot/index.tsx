import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { createColumns, type TableColumns } from "@/features/lots/columns";
import { callMethod } from "@/lib/call-method";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  records: DocumentRecord[];
};

export const Route = createFileRoute("/dashboard/lot/")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Lots",
      }),
      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "Lots",
        fields: [
          "name",
          "lot_no",
          "factory",
          "factory.factory_name",
          "entry_date",
          "arrival_date",
          "grade",
          "grade.grade_code",
          "original_brand",
          "original_brand.title",
          "warehouse",
          "warehouse.title",
          "bags",
          "net_kg_per_bag",
          "docstatus",
          "workflow_state",
        ],
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    return {
      doctype: doctypeResult.doctype,
      records: Array.isArray(listResult.documents) ? listResult.documents : [],
    };
  },

  component: LotListRoute,
});

function LotListRoute() {
  const { doctype, records } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const lots = records as unknown as TableColumns[];

  const { table } = useDataTable({
    data: lots,
    columns: createColumns((lot) =>
      navigate({
        to: "/dashboard/lot/$name",
        params: { name: lot.name },
      }),
    ),
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return (
    <DocTypeListTemplate
      doctype={doctype}
      records={lots}
      table={table}
      onCreate={() => navigate({ to: "/dashboard/lot/new" })}
      onOpen={(name) =>
        navigate({
          to: "/dashboard/lot/$name",
          params: { name },
        })
      }
      onRefresh={() => router.invalidate()}
    >
      {/* <DataTable table={table} /> */}
    </DocTypeListTemplate>
  );
}
