import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { canPerform } from "./dashboard-access";
import { getRolePermissionsFn } from "./permission.function";

const dashboardRoute = getRouteApi("/dashboard");

export function usePermissions() {
  const { currentUser, permissions: initialPermissions } =
    dashboardRoute.useRouteContext();
  const { data: permissions = [] } = useQuery({
    queryKey: ["role-permissions", currentUser.role],
    queryFn: () => getRolePermissionsFn({ data: { role: currentUser.role } }),
    initialData: initialPermissions,
    enabled: currentUser.role !== "SUPER_ADMIN",
  });
  return (permission: string) =>
    canPerform(currentUser, permissions, permission);
}
