import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reports/lot")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
