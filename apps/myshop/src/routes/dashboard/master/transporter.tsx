import PageContainer from "@/components/layout/page-container";
import TransporterList from "@/features/master/transporter";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/master/transporter")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageContainer>
      <TransporterList />
    </PageContainer>
  );
}
