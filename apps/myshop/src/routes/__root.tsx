import {
  createRootRoute,
  HeadContent,
  Link,
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
  shellComponent: RootComponent,
  notFoundComponent: NotFound,
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

function NotFound() {
  return (
    <div className="page-wrap py-20 text-center">
      <h1 className="text-3xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-2 text-sub">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
