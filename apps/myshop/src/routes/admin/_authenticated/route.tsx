import { getCurrentUser } from "@/lib/auth-current-user";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated")({
  beforeLoad: async () => {
    const user = await getCurrentUser();

    if (!user) {
      throw redirect({
        to: "/admin/login",
      });
    }

    return {
      user,
    };
  },

  component: AuthenticatedAdminLayout,
});

function AuthenticatedAdminLayout() {
  return <Outlet />;
}
