import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/salebook/batch-sale")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/dashboard/salebook/batch-sale"!</div>;
}
