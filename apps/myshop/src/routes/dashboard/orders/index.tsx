import { Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import PageContainer from "@/components/layout/page-container";
import GradeList from "@/features/master/tea-grade";

export const Route = createFileRoute("/dashboard/orders/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageContainer
      pageTitle="Tea Grades"
      pageDescription="Manage grades used in tea testing and valuation."
    >
      <Suspense fallback={<p>Loading tea grades...</p>}>
        <GradeList />
      </Suspense>
    </PageContainer>
  );
}
