import PageContainer from "@/components/layout/page-container";
import GradeList from "@/features/master/tea-grade";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/master/tea-grades")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageContainer>
      <GradeList />
    </PageContainer>
  );
}
