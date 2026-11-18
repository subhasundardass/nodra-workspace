import { createFileRoute } from "@tanstack/react-router";
import PageContainer from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { BarGraph } from "@/features/overview/components/bar-graph";
import { RecentSales } from "@/features/overview/components/recent-sales";
import { AreaGraph } from "@/features/overview/components/area-graph";
import { PieGraph } from "@/features/overview/components/pie-graph";
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
