import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/salebook/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    lot: typeof search.lot === "string" ? search.lot : "",
  }),
  component: SaleEntryPage,
});

function SaleEntryPage() {
  const { lot } = Route.useSearch();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sale Entry</h1>
        <p className="text-sm text-muted-foreground">
          Create a sale against the selected lot.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Selected Lot</p>
        <p className="font-medium">{lot || "No lot selected"}</p>
      </div>
    </div>
  );
}
