import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/reports/offer")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
