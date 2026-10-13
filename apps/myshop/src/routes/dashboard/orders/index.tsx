import PageContainer from "@/components/layout/page-container";
import OrderList from "@/pages/orders/list";
import { createFileRoute } from "@tanstack/react-router";
import { callMethod } from "@/lib/call-method";

export const Route = createFileRoute("/dashboard/orders/")({
  loader: () => callMethod("orders.list", {}),
  component: RouteComponent,
});

function RouteComponent() {
  const orders = Route.useLoaderData();

  return (
    <PageContainer pageTitle="Orders" pageDescription="List of orders">
      <OrderList />
    </PageContainer>
  );
}
