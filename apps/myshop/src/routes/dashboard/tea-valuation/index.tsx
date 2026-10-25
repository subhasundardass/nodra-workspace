import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";

import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";
import { createColumns, TableColumns } from "@/features/tea-valuation/columns";

type DocumentRecord = Record<string, unknown>;

type ListData = {
  doctype: DocTypeDefinition;
  lots: TableColumns[];
};

export const Route = createFileRoute("/dashboard/tea-valuation/")({
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
          "bags",
          "net_kg_per_bag",
          "workflow_state",
        ],
        limit: 100,
        offset: 0,
      }),

      callMethod<{ documents: DocumentRecord[] }>("document.list", {
        doctype: "TeaTesting",
        filters: { workflow_state: "Completed" },
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

    // Keep only completed tests, indexed by their linked lot.
    const testingByLot = new Map<string, DocumentRecord>();

    for (const test of testingResult.documents ?? []) {
      const lotName = test.lot;

      if (typeof lotName === "string" && lotName) {
        testingByLot.set(lotName, test);
      }
    }

    // Only confirmed lots with completed testing are ready for valuation.
    const lots: TableColumns[] = (lotsResult.documents ?? [])
      .filter((lot) => testingByLot.has(String(lot.name)))
      .map((lot) => {
        const test = testingByLot.get(String(lot.name))!;

        const bags = Number(lot.bags ?? 0);
        const kgPerBag = Number(lot.net_kg_per_bag ?? 0);

        return {
          name: String(lot.name),
          lot_no: String(lot.lot_no ?? ""),
          factory: String(lot.factory ?? ""),
          "factory.factory_name": String(lot["factory.factory_name"] ?? ""),
          bags,
          net_kg_per_bag: kgPerBag,
          total_weight: bags * kgPerBag,
          test_name: String(test.name ?? ""),
          sample_date: String(test.sample_date ?? ""),
          tested_grade: String(test.tested_grade ?? ""),
          "tested_grade.grade_code": String(
            test["tested_grade.grade_code"] ?? "",
          ),
          taste: String(test.taste ?? ""),
          valuation_status: "Pending",
        };
      });

    return {
      doctype: doctypeResult.doctype,
      lots,
    };
  },

  component: TeaValuationIndex,
});

function TeaValuationIndex() {
  const { doctype, lots } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();

  const handleOpen = (lot: TableColumns) => {
    navigate({
      to: "/dashboard/tea-valuation/$name",
      params: { name: lot.name },
    });
  };

  const handleOpenByName = (name: string) => {
    const lot = lots.find((item) => item.name === name);

    if (lot) handleOpen(lot);
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
      title="Lots Ready for Valuation"
      description={`${lots.length} lots ready for valuation`}
      onRefresh={() => router.invalidate()}
      pageSize={20}
      onOpen={handleOpenByName}
    />
  );
}
