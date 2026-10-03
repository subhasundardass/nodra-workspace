import SignUpViewPage from "@/auth/components/sign-up-view";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/sign-up/")({
  head: () => ({
    meta: [{ title: "Sign Up" }],
  }),
  component: SignUpViewPage,
});
