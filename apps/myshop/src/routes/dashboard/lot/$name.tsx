import { LotForm } from "@/features/lots/form";
import { callMethod } from "@/lib/call-method";
import { getQueryClient } from "@/lib/query-client";
import { lotsQueryKey } from "@/features/lots/lots.api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { DocTypeDefinition } from "nodra";
import { toast } from "sonner";

type LotRecord = Record<string, unknown>;

type EditLotData = {
  doctype: DocTypeDefinition;
  lot: LotRecord;
};

export const Route = createFileRoute("/dashboard/lot/$name")({
  loader: async ({ params }): Promise<EditLotData> => {
    const [doctypeResult, lot] = await Promise.all([
      callMethod<{ doctypes: DocTypeDefinition[] }>("nodra.doctypes"),
      callMethod<LotRecord>("lots.get", { name: params.name }),
    ]);

    const doctype = doctypeResult.doctypes.find((item) => item.name === "Lots");

    if (!doctype) {
      throw new Error('DocType "Lot" is not registered');
    }

    return { doctype, lot };
  },

  component: LotRoute,

  errorComponent: ({ error }) => (
    <div className="space-y-2 p-4">
      <h2 className="font-semibold">Unable to load Lot form</h2>
      <pre className="whitespace-pre-wrap text-sm text-destructive">sdfsd</pre>
    </div>
  ),
});

function LotRoute() {
  const { doctype, lot } = Route.useLoaderData();
  const { name } = Route.useParams();
  const navigate = useNavigate();

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      await callMethod("lots.update", {
        name,
        data: values,
      });

      await getQueryClient().invalidateQueries({
        queryKey: lotsQueryKey,
      });

      toast.success("Lot updated successfully");

      await navigate({
        to: "/dashboard/lot",
        search: { mode: undefined },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update lot",
      );
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Edit Lot</h1>
        <p className="text-sm text-muted-foreground">Lot ID: {name}</p>
      </div>

      <LotForm
        doctype={doctype}
        mode="edit"
        initialValues={lot}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
