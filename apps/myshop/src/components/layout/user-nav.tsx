import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CurrentUser } from "@/lib/auth-current-user";
import { callMethod, MethodCallError } from "@/lib/call-method";

function getInitials(fullName: string, email: string) {
  const source = fullName.trim() || email.trim();

  return (
    source
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

type UserNavProps = {
  user: CurrentUser | null;
  onSignOut?: () => void | Promise<void>;
};

export function UserNav({ user, onSignOut }: UserNavProps) {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.fullName || user?.email || "User";
  const email = user?.email ?? "";
  const initials = getInitials(user?.fullName ?? "", email);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        await callMethod({
          data: {
            method: "auth.logout",
          },
        });
      }

      toast.success("Signed out successfully.");

      await navigate({
        to: "/auth/sign-in",
        replace: true,
      });
    } catch (error) {
      toast.error(
        error instanceof MethodCallError
          ? error.message
          : "Unable to sign out. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" sideOffset={10}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">{displayName}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              void navigate({ to: "/settings" });
            }}
          >
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup> 

        <DropdownMenuSeparator />
        */}

        <DropdownMenuItem
          disabled={signingOut}
          onSelect={(event) => {
            // Prevent Radix from closing the menu before we can show
            // the "Signing out..." state. We close it manually after.
            event.preventDefault();
            void handleSignOut();
          }}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
