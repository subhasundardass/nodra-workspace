import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reports/sale")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
