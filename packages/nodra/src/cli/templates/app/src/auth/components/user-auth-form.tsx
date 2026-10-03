import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/lib/form";
import { useTransition } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { login } from "../auth.function";

const formSchema = z.object({
  email: z.email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export default function UserAuthForm() {
  const [loading, startTransition] = useTransition();

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },

    validators: {
      onSubmit: formSchema,
    },

    onSubmit: ({ value }) => {
      console.log("Signed !");
      startTransition(async () => {
        try {
          await login({
            data: {
              email: value.email,
              password: value.password,
            },
          });

          toast.success("Signed In Successfully!");

          // Discard cached data and route loaders from the previous session.
          window.location.assign("/dashboard");
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "INVALID_CREDENTIALS"
          ) {
            toast.error("Invalid email or password");
            return;
          }

          // Log the raw error for debugging; never show it to the user.
          console.error(error);
          toast.error("Unable to sign in");
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
            name="email"
            children={(field) => (
              <field.TextField
                label="Email"
                type="email"
                placeholder="Enter your email..."
                disabled={loading}
                autoComplete="email"
                className="bg-primary-foreground font-bold"
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
                autoComplete="current-password"
                className="bg-primary-foreground font-bold"
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
