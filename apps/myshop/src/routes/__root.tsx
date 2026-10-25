import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { ActiveThemeProvider } from "@/components/themes/active-theme";
import ThemeProvider from "@/components/themes/theme-provider";
import { DEFAULT_THEME, THEMES } from "@/components/themes/theme.config";
import { Toaster } from "@/components/ui/sonner";
import { seo } from "@/lib/seo";

import type { AppContext } from "@/lib/app.context";
import appCss from "@/styles/globals.css?url";

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
};

const getActiveTheme = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  const cookieValue = getCookie("active_theme");

  if (cookieValue && THEMES.some((theme) => theme.value === cookieValue)) {
    return cookieValue;
  }

  return DEFAULT_THEME;
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return String(error);
}

function isForbiddenError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    /\b403\b/.test(message) ||
    /\bforbidden\b/i.test(message) ||
    /you need one of these roles/i.test(message) ||
    /permission denied/i.test(message) ||
    /not permitted/i.test(message)
  );
}

function RootErrorComponent({
  error,
  reset,
}: {
  error: unknown;
  reset: () => void;
}) {
  const forbidden = isForbiddenError(error);
  const message = getErrorMessage(error);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6"
      role={forbidden ? "alert" : "main"}
    >
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {forbidden ? "Access denied" : "Something went wrong!"}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {forbidden
            ? "Your account does not have permission to access this resource. Contact your administrator if you need access."
            : "An unexpected error occurred. You can try again."}
        </p>

        {forbidden && (
          <p className="mt-4 break-words rounded-md bg-muted p-3 text-left text-sm">
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.assign("/dashboard/overview");
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<AppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: META_THEME_COLORS.light },
      ...seo(),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
    ],
  }),

  loader: async () => {
    const activeTheme = await getActiveTheme();
    return { activeTheme };
  },

  component: RootDocument,
  errorComponent: RootErrorComponent,
});

function RootDocument() {
  const { activeTheme } = Route.useLoaderData();

  return (
    <html lang="en" suppressHydrationWarning data-theme={activeTheme}>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (
                  localStorage.theme === 'dark' ||
                  (
                    (!('theme' in localStorage) || localStorage.theme === 'system') &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches
                  )
                ) {
                  document
                    .querySelector('meta[name="theme-color"]')
                    ?.setAttribute('content', '${META_THEME_COLORS.dark}');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>

      <body className="overflow-x-hidden overscroll-none bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <ActiveThemeProvider initialTheme={activeTheme}>
            <Toaster />
            <Outlet />
          </ActiveThemeProvider>
        </ThemeProvider>

        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
