import { ArrowLeft, House, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type ForbiddenPageProps = {
  message?: string;
};

export function ForbiddenPage({
  message = "You don't have permission to access this resource.",
}: ForbiddenPageProps) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="size-8 text-destructive" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Error 403</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Access denied
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Go back
          </Button>

          <Button asChild>
            <Link to="/dashboard/overview">
              <House className="mr-2 size-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
