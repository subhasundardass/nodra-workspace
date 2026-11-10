import StockOverview from "@/features/inventory/overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/inventory/stock-overview")({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockOverview />;
}
