import StockByLocation from "@/features/inventory/stock-by-location";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/inventory/stock-by-location")({
  component: RouteComponent,
});

function RouteComponent() {
  return <StockByLocation />;
}
