import { Settings, LogOut, User, ShieldCheck } from "lucide-react";
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
import { logout } from "@/auth/auth.function";
import { toast } from "sonner";

type UserNavProps = {
  user: any;
};

export function UserNav({ user }: UserNavProps) {
  const handleLogout = async () => {
    try {
      await logout();

      toast.success("Signed out successfully");

      // Discard cached data and route loaders from the signed-out session.
      window.location.replace("/auth/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Unable to sign out");
    }
  };

  const initials = "Admin"
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 transition-all hover:bg-accent"
        >
          <Avatar className="h-9 w-9 border shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>

          {/* Online indicator */}
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 rounded-xl p-2 shadow-lg"
        align="end"
        sideOffset={8}
      >
        {/* User information */}
        <DropdownMenuLabel className="p-3 font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>

              <p className="text-muted-foreground truncate text-xs">
                {user.email || user.username}
              </p>

              <div className="mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-primary" />

                <span className="text-muted-foreground text-[11px] font-medium">
                  {user.role?.replaceAll("_", " ") ?? "User"}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Account */}
        {user.role !== "MEMBER" && (
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer gap-3 rounded-lg py-2.5">
              <User className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Profile</span>
                <span className="text-muted-foreground text-[11px]">
                  View your profile
                </span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer gap-3 rounded-lg py-2.5">
              <Settings className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Settings</span>
                <span className="text-muted-foreground text-[11px]">
                  Manage your account
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer gap-3 rounded-lg py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />

          <div className="flex flex-col">
            <span>Sign out</span>
            <span className="text-destructive/60 text-[11px]">
              End your current session
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
