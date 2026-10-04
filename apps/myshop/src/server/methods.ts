/**
 * Whitelisted server methods, callable via POST /api/method/:methodPath
 * (see app/routes/api/method/$methodPath.ts).
 *
 * `MethodRegistry` (src/api/method.ts) was already framework-agnostic — it
 * never depended on Fastify — so it's reused unchanged. This file is just
 * the registration point that `NodraApp.create()` calls once at boot.
 * Add your app's business-logic methods here, e.g.:
 *
 *   registry.register('crm.get_pipeline_summary', async (args) => {
 *     const app = await getNodra();
 *     return app.orm.getList('Opportunity', { ... });
 *   }, { requireAuth: true, requiredRoles: ['Sales Manager'] });
 */
import type { MethodRegistry } from "nodra/api/method";
import { AuthenticationError } from "nodra/auth";
import { getNodra } from "./nodra-app";

export function registerAppMethods(registry: MethodRegistry): void {
  registry.register(
    "ping",
    () => ({ pong: true, time: new Date().toISOString() }),
    { requireAuth: false },
  );

  //--Doctypes
  registry.register(
    "debug.doctypes",
    async () => {
      const app = await getNodra();

      return {
        doctypes: app.registry.list(),
      };
    },
    { requireAuth: false },
  );

  //--Login
  registry.register(
    "auth.login",
    async (ctx) => {
      const email = String(ctx.args.email ?? "").trim();
      const password = String(ctx.args.password ?? "");

      if (!email || !password) {
        throw new AuthenticationError("Email and password are required");
      }

      const app = await getNodra();

      const result = await app.auth.login({
        username: email,
        password,
      });

      return {
        user: result.user,
        expiresAt: result.expiresAt,
        token: result.token,
      };
    },
    { requireAuth: false },
  );

  //-- me
  registry.register(
    "auth.me",
    async (ctx) => {
      if (!ctx.user) {
        throw new AuthenticationError("Authentication required");
      }

      return {
        authenticated: true,
        user: ctx.user,
        session: ctx.session,
      };
    },
    { requireAuth: true },
  );

  //-- logout
  registry.register(
    "auth.logout",
    async (ctx) => {
      if (!ctx.session) {
        return { success: true };
      }

      return {
        success: true,
      };
    },
    { requireAuth: true },
  );
}
