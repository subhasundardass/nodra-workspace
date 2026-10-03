import { getRouteApi } from "@tanstack/react-router";
import { useMemo } from "react";
import { getAccessScope } from "./access-scope";

const dashboardRoute = getRouteApi("/dashboard");

export function useAccessScope() {
  const { currentUser } = dashboardRoute.useRouteContext();
  return useMemo(() => getAccessScope(currentUser), [currentUser]);
}
