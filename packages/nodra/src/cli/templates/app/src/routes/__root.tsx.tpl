import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nodra" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundComponent() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {" "}
      <div style={{ width: "100%", maxWidth: "520px", textAlign: "center" }}>
        {" "}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            marginBottom: "24px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)",
            color: "white",
            fontSize: "32px",
            fontWeight: 800,
            boxShadow: "0 10px 30px rgba(59, 130, 246, 0.25)",
          }}
        >
          {" "}
          N{" "}
        </div>{" "}
        <div
          style={{
            marginBottom: "8px",
            color: "#94a3b8",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {" "}
          Nodra Framework{" "}
        </div>{" "}
        <h1
          style={{
            margin: 0,
            fontSize: "64px",
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          {" "}
          404{" "}
        </h1>{" "}
        <h2
          style={{
            marginTop: "20px",
            marginBottom: "10px",
            fontSize: "24px",
            fontWeight: 700,
            color: "#f8fafc",
          }}
        >
          {" "}
          Page not found{" "}
        </h2>{" "}
        <p
          style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: "15px",
            lineHeight: 1.7,
          }}
        >
          {" "}
          The route you requested does not exist or may have been moved.{" "}
        </p>{" "}
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            marginTop: "28px",
            padding: "10px 18px",
            border: 0,
            borderRadius: "10px",
            background: "#2563eb",
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {" "}
          Go back home{" "}
        </button>{" "}
      </div>{" "}
    </main>
  );
}
