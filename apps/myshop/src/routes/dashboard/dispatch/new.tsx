import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/dispatch/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/dispatch/new"!</div>;
}
