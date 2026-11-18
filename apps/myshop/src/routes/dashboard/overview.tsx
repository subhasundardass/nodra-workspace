import { createFileRoute } from "@tanstack/react-router";
import TeaDashboard from "@/features/overview/components/overview";

export const Route = createFileRoute("/dashboard/overview")({
  head: () => ({
    meta: [{ title: "Dashboard: Overview" }],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  return <TeaDashboard />;
}
