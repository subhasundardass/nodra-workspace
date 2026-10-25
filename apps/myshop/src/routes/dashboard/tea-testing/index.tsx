import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";
import {
  createColumns,
  type TableColumns,
} from "@/features/tea-testing/columns";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  lots: TableColumns[];
};

export const Route = createFileRoute("/dashboard/tea-testing/")({
  loader: async (): Promise<ListData> => {
    const [doctypeResult, lotsResult, testingResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "Lots",
      }),

      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "Lots",
        filters: { docstatus: 51 },
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
          "bags",
          "net_kg_per_bag",
          "workflow_state",
        ],
        limit: 100,
        offset: 0,
      }),

      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "TeaTesting",
        fields: [
          "name",
          "lot",
          "sample_date",
          "tested_grade",
          "tested_grade.grade_code",
          "taste",
          "workflow_state",
        ],
        limit: 1000,
        offset: 0,
      }),
    ]);

    if (!doctypeResult.doctype) {
      throw new Error('DocType "Lots" is not registered.');
    }

    const testingByLot = new Map<string, DocumentRecord>();

    for (const test of testingResult.documents ?? []) {
      const lotName = test.lot;

      if (typeof lotName === "string" && lotName) {
        testingByLot.set(lotName, test);
      }
    }

    const lots: TableColumns[] = (lotsResult.documents ?? []).map((lot) => {
      const test = testingByLot.get(String(lot.name));

      return {
        ...lot,
        test_name: test?.name as string | undefined,
        sample_date: test?.sample_date as string | undefined,
        tested_grade: test?.tested_grade as string | undefined,
        "tested_grade.grade_code": test?.["tested_grade.grade_code"] as
          string | undefined,
        taste: test?.taste as string | undefined,
        testing_status: test?.workflow_state as string | undefined,
      } as TableColumns;
    });

    return {
      doctype: doctypeResult.doctype,
      lots,
    };
  },

  component: TeaTestingIndex,
});

function TeaTestingIndex() {
  const { doctype, lots } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();

  // Open an existing test, or start testing for this Lot.
  const handleOpen = (lot: TableColumns) => {
    navigate({
      to: "/dashboard/tea-testing/$name",
      params: { name: lot.name },
    });
  };

  // DocTypeListTemplate's onOpen callback receives a document name.
  const handleOpenByName = (name: string) => {
    const lot = lots.find((item) => item.name === name);

    if (lot) {
      handleOpen(lot);
    }
  };

  const { table } = useDataTable({
    data: lots,
    columns: createColumns(handleOpen),
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
      title="Lots Ready for Testing"
      description={`${lots.length} confirmed lots`}
      onRefresh={() => router.invalidate()}
      pageSize={20}
      onOpen={handleOpenByName}
    />
  );
}
