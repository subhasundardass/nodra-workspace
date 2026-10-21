import type { MethodRegistry } from "nodra/api/method";
import { AuthenticationError, extractSessionToken } from "../auth";

export function registerAuthMethods(
  registry: MethodRegistry,
  getApp: () => Promise<any>,
): void {
  registry.register(
    "auth.login",
    async (ctx) => {
      const email = String(ctx.args.email ?? "").trim();
      const password = String(ctx.args.password ?? "");

      if (!email || !password) {
        throw new AuthenticationError("Email and password are required");
      }

      const app = await getApp();
      const result = await app.asSystem(() =>
        app.auth.login({ username: email, password }),
      );

      ctx.state.set("sessionToken", result.token);

      return {
        user: result.user,
        expiresAt: result.expiresAt,
      };
    },
    { requireAuth: false },
  );

  registry.register(
    "auth.me",
    async (ctx) => ({
      authenticated: true,
      user: ctx.user,
      expiresAt: ctx.session?.expiresAt ?? null,
    }),
    { requireAuth: true },
  );

  registry.register(
    "auth.logout",
    async (ctx) => {
      const app = await getApp();
      const token = extractSessionToken(ctx.request.headers, "session_token");

      if (token) {
        await app.auth.logout(token);
      }

      ctx.state.set("clearSessionCookie", true);

      return { success: true };
    },
    { requireAuth: true },
  );
}
