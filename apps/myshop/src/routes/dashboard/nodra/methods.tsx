import { DashboardPage } from "@/pages/dashboard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/nodra/methods")({
  component: RouteComponent,
});

function RouteComponent() {
<<<<<<< HEAD:apps/todo/src/routes/dashboard/overview.tsx
  return <DashboardPage />;
=======
  return <div>Hello "/dashboard/nodra/methods"!</div>;
>>>>>>> origin/core:apps/myshop/src/routes/dashboard/nodra/methods.tsx
}
