import PageContainer from "@/components/layout/page-container";
import BrandList from "@/features/master/brand";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/master/brands")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageContainer>
      <BrandList />
    </PageContainer>
  );
}
