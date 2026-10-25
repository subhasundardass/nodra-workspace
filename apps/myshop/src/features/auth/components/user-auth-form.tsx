import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callMethod } from "@/lib/call-method";
import { MethodCallError } from "nodra/client";

const formSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
  password: z.string().min(1, "Enter your password"),
});

export default function UserAuthForm() {
  const [loading, startTransition] = useTransition();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@123");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = formSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        await callMethod("auth.login", {
          email: result.data.email,
          password: result.data.password,
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
  }

  return (
    <form className="w-full space-y-2" onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="Enter your email..."
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email}
            </p>
          )}
        </div>
      </FieldGroup>

      <FieldGroup>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password..."
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((current) => ({
                ...current,
                password: undefined,
              }));
            }}
            disabled={loading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
        </div>
      </FieldGroup>

      <Button disabled={loading} className="mt-2 ml-auto w-full" type="submit">
        {loading ? "Signing in..." : "Continue With Email"}
      </Button>
    </form>
  );
}
