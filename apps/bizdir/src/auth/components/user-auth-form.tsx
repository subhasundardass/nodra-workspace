import { login } from "@/auth/auth.function";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/lib/form";
import { useTransition } from "react";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export default function UserAuthForm() {
  const [loading, startTransition] = useTransition();

  const form = useAppForm({
    defaultValues: {
      username: "",
      password: "",
    },

    validators: {
      onSubmit: formSchema,
    },

    onSubmit: ({ value }) => {
      startTransition(async () => {
        try {
          await login({
            data: {
              username: value.username,
              password: value.password,
            },
          });

          toast.success("Signed In Successfully!");

          // Discard cached data and route loaders from the previous session.
          window.location.assign("/dashboard");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to sign in",
          );
        }
      });
    },
  });

  return (
    <>
      <form
        className="w-full space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name="username"
            children={(field) => (
              <field.TextField
                label="Username"
                type="text"
                placeholder="Enter your username..."
                disabled={loading}
                className="bg-primary-foreground"
              />
            )}
          />

          <form.AppField
            name="password"
            children={(field) => (
              <field.TextField
                label="Password"
                type="password"
                placeholder="Enter your password..."
                disabled={loading}
                className="bg-primary-foreground"
              />
            )}
          />
        </FieldGroup>

        <Button
          disabled={loading}
          className="mt-2 ml-auto w-full"
          type="submit"
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
      </div>
    </>
  );
}
