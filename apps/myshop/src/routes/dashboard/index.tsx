import { createFileRoute, redirect } from "@tanstack/react-router";
import { callMethod } from "nodra/client";

export const Route = createFileRoute("/dashboard/")({
  beforeLoad: async ({ location }) => {
    let user = null;

    try {
      user = await callMethod("auth.me");
      console.log(user);
    } catch {
      user = null;
    }

    if (!user) {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: location.href },
      });
    }

    throw redirect({ to: "/dashboard/overview" });
  },
});
