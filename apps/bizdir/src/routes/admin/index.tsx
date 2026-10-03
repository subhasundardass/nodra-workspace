import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/auth/auth.function";
export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw redirect({
        to: "/auth/sign-in",
      });
    }

    return {
      currentUser,
    };
  },
});
