import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-current-user";

export const Route = createFileRoute("/admin/_authenticated/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();

  async function handleLogout() {
    await fetch("/api/method/auth.logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({}),
    });

    await navigate({
      to: "/admin/login",
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          <p className="mt-2 text-muted-foreground">Welcome to the system.</p>
        </div>

        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="font-semibold">Current User</h2>

        <pre className="mt-3 overflow-auto rounded-md bg-muted p-4 text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
}
