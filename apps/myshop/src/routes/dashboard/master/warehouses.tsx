import PageContainer from "@/components/layout/page-container";
import WarehouseList from "@/features/master/warehouse";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/master/warehouses")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageContainer>
      <WarehouseList />
    </PageContainer>
  );
}
