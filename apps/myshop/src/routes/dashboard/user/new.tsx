import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { callMethod } from "@/lib/call-method";

type Role = {
  name: string;
};

type RolesResult = {
  roles: Role[];
};

type UserType = "System Manager" | "Website User";

export const Route = createFileRoute("/dashboard/user/new")({
  loader: async (): Promise<RolesResult> => {
    return callMethod<RolesResult>("roles.list", { limit: 200 });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { roles } = Route.useLoaderData();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("System Manager");
  const [enabled, setEnabled] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleRole(role: string, checked: boolean | "indeterminate") {
    setSelectedRoles((current) =>
      checked === true
        ? [...new Set([...current, role])]
        : current.filter((item) => item !== role),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !firstName.trim() || !password) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    setSaving(true);

    try {
      await callMethod("users.create", {
        email: email.trim().toLowerCase(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        user_type: userType,
        enabled,
        roles: selectedRoles,
      });

      toast.success("User created successfully.");
      await navigate({ to: "/dashboard/user" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create user.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Create User</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create an account and assign its roles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-medium">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name *</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-medium">Account Settings</h2>

          <div className="space-y-2">
            <Label>User Type</Label>
            <Select
              value={userType}
              onValueChange={(value) => setUserType(value as UserType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="System Manager">System User</SelectItem>
                <SelectItem value="Website User">Website User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Initial Password *</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">
              Use at least 8 characters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked === true)}
            />
            <Label htmlFor="enabled">Account enabled</Label>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border p-5">
          <div>
            <h2 className="font-medium">Roles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the permissions this user should receive.
            </p>
          </div>

          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No roles are available.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <div key={role.name} className="flex items-center gap-3">
                  <Checkbox
                    id={`role-${role.name}`}
                    checked={selectedRoles.includes(role.name)}
                    onCheckedChange={(checked) =>
                      toggleRole(role.name, checked)
                    }
                  />
                  <Label htmlFor={`role-${role.name}`}>{role.name}</Label>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => navigate({ to: "/dashboard/user" })}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
}
