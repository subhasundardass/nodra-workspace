import PageContainer from "@/components/layout/page-container";
import FactoryList from "@/features/master/factory";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/master/factories")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageContainer>
      <FactoryList />
    </PageContainer>
  );
}
