import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getNodra } from "@/server/nodra-app";

import { AuthService, InvalidCredentialsError } from "./auth.service";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

/**
 * Login
 */
export const login = createServerFn({
  method: "POST",
})
  .validator(loginSchema)
  .handler(async ({ data }) => {
    try {
      const app = await getNodra();
      const authService = new AuthService(app.orm);
      const user = await authService.login(data.email, data.password);

      return user;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new Error("INVALID_CREDENTIALS");
      }

      throw error;
    }
  });

/**
 * Logout
 */
export const logout = createServerFn({
  method: "POST",
}).handler(async () => {
  const app = await getNodra();
  const authService = new AuthService(app.orm);

  await authService.logout();

  return {
    success: true as const,
  };
});

/**
 * Get the currently authenticated user.
 */
export const getCurrentUser = createServerFn({
  method: "GET",
}).handler(async () => {
  const app = await getNodra();
  const authService = new AuthService(app.orm);

  return authService.getCurrentUser();
});
