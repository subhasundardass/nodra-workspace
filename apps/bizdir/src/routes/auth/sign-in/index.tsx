import SignInViewPage from "@/auth/components/sign-in-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/sign-in/")({
  head: () => ({
    meta: [{ title: "Sign In" }],
  }),
  component: SignInViewPage,
});
