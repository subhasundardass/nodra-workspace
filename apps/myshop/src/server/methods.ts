/**
 * Whitelisted server methods, callable via POST /api/method/:methodPath.
 */

import {
  authenticate,
  type MethodContext,
  type MethodRegistry,
  type ResolvedIdentity,
} from "nodra/api/method";
import { AuthenticationError, extractSessionToken } from "nodra/auth";

import { getNodra } from "./nodra-app";

async function resolveMethodIdentity(
  ctx: MethodContext,
): Promise<ResolvedIdentity | null> {
  const token = extractSessionToken(ctx.request.headers, "session_token");

  if (!token) {
    console.log("[auth] No session token", ctx.method);
    return null;
  }

  const app = await getNodra();
  const session = await app.sessions.resolve(token);

  if (!session) {
    console.log("[auth] Session not found", ctx.method);
    return null;
  }

  if (session.subject.type !== "User") {
    console.log("[auth] Unexpected session subject", session.subject.type);
    return null;
  }

  // Identity lookup happens before the ORM user session is established.
  const user = await app.asSystem(() =>
    app.orm.getDoc("User", session.subject.id),
  );

  if (!user.get("enabled")) {
    console.log("[auth] User disabled", session.subject.id);
    return null;
  }

  const rawRoles = user.get("roles") as Array<{ role: string }> | undefined;
  const roles = rawRoles?.map((item) => item.role).filter(Boolean) ?? [];

  // console.log("SESSION", session);

  return {
    user: {
      email: String(user.get("email") ?? ""),
      fullName: String(user.get("full_name") ?? ""),
      userType: String(user.get("user_type") ?? ""),
      roles,
    },
    session,
  };
}

export function registerAppMethods(registry: MethodRegistry): void {
  /**
   * Authentication must run before access control.
   *
   * Pipeline:
   *
   * authenticate()
   *     ↓
   * accessControl
   *     ↓
   * method middleware
   *     ↓
   * method handler
   */
  registry.use(authenticate(resolveMethodIdentity));

  // ---------------------------------------------------------------------------
  // Ping
  // ---------------------------------------------------------------------------

  registry.register(
    "ping",
    () => ({
      pong: true,
      time: new Date().toISOString(),
    }),
    {
      requireAuth: false,
    },
  );

  // ---------------------------------------------------------------------------
  // Doctypes
  // ---------------------------------------------------------------------------

  registry.register(
    "debug.doctypes",
    async () => {
      const app = await getNodra();

      return {
        doctypes: app.registry.list(),
      };
    },
    {
      requireAuth: false,
    },
  );

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  registry.register(
    "debug.methods",
    async () => {
      const app = await getNodra();

      const methods = app.methods.list().map((path) => {
        const definition = app.methods.get(path);

        if (!definition) return null;

        return {
          path,
          requireAuth: definition.requireAuth,
          requiredRoles: definition.requiredRoles,
          middlewareCount: definition.middleware.length,
        };
      });

      return {
        methods: methods.filter(Boolean),
        total: methods.length,
      };
    },
    // {
    //   requireAuth: true,
    //   requiredRoles: ["System User"],
    // },
  );

  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------

  registry.register(
    "auth.login",
    async (ctx) => {
      const email = String(ctx.args.email ?? "").trim();
      const password = String(ctx.args.password ?? "");

      if (!email || !password) {
        throw new AuthenticationError("Email and password are required");
      }

      const app = await getNodra();

      const result = await app.asSystem(() =>
        app.auth.login({
          username: email,
          password,
        }),
      );

      // The HTTP transport reads this value and
      // converts it into an HttpOnly cookie.
      ctx.state.set("sessionToken", result.token);

      return {
        user: result.user,
        expiresAt: result.expiresAt,
      };
    },
    {
      requireAuth: false,
    },
  );

  // ---------------------------------------------------------------------------
  // Current user
  // ---------------------------------------------------------------------------

  registry.register(
    "auth.me",
    async (ctx) => {
      return {
        authenticated: true,
        user: ctx.user,
        expiresAt: ctx.session?.expiresAt ?? null,
      };
    },
    {
      requireAuth: true,
    },
  );

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  registry.register(
    "auth.logout",
    async (ctx) => {
      const token = extractSessionToken(ctx.request.headers, "session_token");

      if (token) {
        const app = await getNodra();
        await app.auth.logout(token);
      }

      ctx.state.set("clearSessionCookie", true);

      return { success: true };
    },
    {
      requireAuth: false,
    },
  );
}
