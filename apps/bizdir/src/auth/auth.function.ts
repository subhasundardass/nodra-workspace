import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authService } from "./auth.service";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Login
export const login = createServerFn({
  method: "POST",
})
  .validator(loginSchema)
  .handler(async ({ data }) => {
    return await authService.login(data.username, data.password);
  });

// Logout
export const logout = createServerFn({
  method: "POST",
}).handler(async () => {
  await authService.logout();

  return {
    success: true,
  };
});

// Current user
export const getCurrentUser = createServerFn({
  method: "GET",
}).handler(async () => {
  return await authService.getCurrentUser();
});
