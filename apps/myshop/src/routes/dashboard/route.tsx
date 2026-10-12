import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { callMethod } from "nodra/client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import CommandMenu from "@/components/command-menu";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { InfobarProvider } from "@/components/ui/infobar";
import { InfoSidebar } from "@/components/layout/info-sidebar";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

type AuthMeResult = {
  authenticated: boolean;
};

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    let authenticated = false;

    try {
      const result = await checkDashboardAuth();
      authenticated = result.authenticated === true;
    } catch (error) {
      console.error("Dashboard authentication failed:", error);
      authenticated = false;
    }

    if (!authenticated) {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: location.href },
      });
    }

    if (location.pathname === "/dashboard") {
      throw redirect({ to: "/dashboard/overview" });
    }
  },
  component: DashboardLayout,
});

const checkDashboardAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const cookie = getRequestHeaders().get("cookie");

    return callMethod<{ authenticated: boolean }>(
      "auth.me",
      {},
      {
        headers: cookie ? { cookie } : {},
      },
    );
  },
);

function DashboardLayout() {
  return (
    <CommandMenu>
      <SidebarProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>

        <AppSidebar />

        <SidebarInset id="main-content" tabIndex={-1}>
          <Header />

          <InfobarProvider defaultOpen={false}>
            <Outlet />
            <InfoSidebar side="right" />
          </InfobarProvider>
        </SidebarInset>
      </SidebarProvider>
    </CommandMenu>
  );
}
