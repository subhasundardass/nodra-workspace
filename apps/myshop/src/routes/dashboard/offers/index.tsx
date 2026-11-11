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
  type OfferSheetRecord,
} from "@/features/offers/columns";

export const Route = createFileRoute("/dashboard/offers/")({
  loader: async () => {
    const [doctypeResult, listResult] = await Promise.all([
      callMethod<{ doctype: DocTypeDefinition }>("nodra.doctype.get", {
        name: "OfferSheet",
      }),
      callMethod<{ documents: OfferSheetRecord[] }>("document.list", {
        doctype: "OfferSheet",
        fields: [
          "name",
          "offer_date",
          "broker_type",
          "offer_lots",
          "total_bags",
          "total_kg",
          "workflow_state",
        ],
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

  const openOffer = (name: string) =>
    navigate({
      to: "/dashboard/offers/$name",
      params: { name },
    });

  const { table } = useDataTable({
    data: records,
    columns: createColumns(openOffer),
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
      title="Offer Sheets"
      doctype={doctype}
      records={records}
      table={table}
      onCreate={() => navigate({ to: "/dashboard/offers/new" })}
      onOpen={openOffer}
      onRefresh={() => router.invalidate()}
      pageSize={20}
      totals={[
        { fieldname: "total_bags", label: "Total Bags" },
        { fieldname: "total_kg", label: "Total Kgs", decimals: 2 },
      ]}
    ></DocTypeListTemplate>
  );
}
