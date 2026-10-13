import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/lib/form";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { toast } from "sonner";
import * as z from "zod";
import { nodraCallMethod, MethodCallError } from "nodra/client";
import { callMethod } from "@/lib/call-method";

const formSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
  password: z.string().min(1, "Enter your password"),
});

export default function UserAuthForm() {
  const [loading, startTransition] = useTransition();
  const navigate = useNavigate();

  const form = useAppForm({
    defaultValues: {
      email: "admin@localhost.com",
      password: "Admin@123",
    },

    validators: {
      onSubmit: formSchema,
    },

    onSubmit: ({ value }) => {
      startTransition(async () => {
        try {
          // await nodraCallMethod("auth.login", {
          //   email: value.email,
          //   password: value.password,
          // });
          await callMethod("auth.login", {
            email: value.email,
            password: value.password,
          });

          toast.success("Signed in successfully!");

          await navigate({ to: "/dashboard" });
        } catch (error) {
          if (error instanceof MethodCallError) {
            toast.error(error.message);
            return;
          }

          toast.error("Something went wrong. Please try again.");
        }
      });
    },
  });

  return (
    <form
      className="w-full space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
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
            />
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <form.AppField
          name="password"
          children={(field) => (
            <field.TextField
              label="Password"
              type="password"
              placeholder="Enter your password..."
              disabled={loading}
            />
          )}
        />
      </FieldGroup>

      <Button disabled={loading} className="mt-2 ml-auto w-full" type="submit">
        {loading ? "Signing in..." : "Continue With Email"}
      </Button>
    </form>
  );
}
