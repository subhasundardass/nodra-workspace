import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { getCurrentUser } from "@/auth/auth.function";
import AppSidebar from "@/components/admin/app-sidebar";
import CommandMenu from "@/components/admin/command-menu";
import Header from "@/components/admin/header";
import { InfoSidebar } from "@/components/admin/info-sidebar";
import { ActiveThemeProvider } from "@/components/themes/active-theme";
import { DEFAULT_THEME, THEMES } from "@/components/themes/theme.config";
import { InfobarProvider } from "@/components/ui/infobar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import "../styles/admin.css";
import ThemeProvider from "@/components/themes/theme-provider";

const THEME_COOKIE = "active_theme";
const MAIN_CONTENT_ID = "main-content";
const META_THEME_COLOR = "#ffffff";

/** Read the theme cookie on the server, falling back to the default. */
const getActiveTheme = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const value = getCookie(THEME_COOKIE);
  const isValid = THEMES.some((theme) => theme.value === value);
  return isValid && value ? value : DEFAULT_THEME;
});

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw redirect({ to: "/auth/sign-in" });
    }

    return { currentUser };
  },

  loader: async () => ({ activeTheme: await getActiveTheme() }),

  head: () => ({
    meta: [
      { title: "Dashboard" },
      { name: "description", content: "Dashboard with Application" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: META_THEME_COLOR },
    ],
  }),

  component: DashboardLayout,
});

function SkipToContent() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to content
    </a>
  );
}

function DashboardLayout() {
  const { currentUser } = Route.useRouteContext();
  const { activeTheme } = Route.useLoaderData();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {/* NOTE: assumes ActiveThemeProvider accepts `initialTheme`. */}
      <ActiveThemeProvider initialTheme={activeTheme}>
        <CommandMenu>
          <SidebarProvider>
            <SkipToContent />
            <AppSidebar />

            <SidebarInset id={MAIN_CONTENT_ID} tabIndex={-1}>
              <Header currentUser={currentUser} />

              <InfobarProvider defaultOpen={false}>
                <Outlet />
                <InfoSidebar side="right" />
              </InfobarProvider>
            </SidebarInset>
          </SidebarProvider>
        </CommandMenu>
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}
