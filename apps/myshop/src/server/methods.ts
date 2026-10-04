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

  // No session cookie/token means anonymous request.
  if (!token) {
    return null;
  }

  const app = await getNodra();

  // Resolve the opaque session from Redis.
  const session = await app.sessions.resolve(token);

  // Invalid or expired session.
  if (!session) {
    return null;
  }

  // Only User sessions can authenticate application methods.
  if (session.subject.type !== "User") {
    return null;
  }

  // Session subject ID is the User document name.
  const user = await app.orm.getDoc("User", session.subject.id);

  // Disabled user cannot authenticate.
  if (!user.get("enabled")) {
    return null;
  }

  const rawRoles = user.get("roles") as Array<{ role: string }> | undefined;

  const roles = rawRoles?.map((item) => item.role).filter(Boolean) ?? [];

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
  // Debug
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

      const result = await app.auth.login({
        username: email,
        password,
      });

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
      if (!ctx.session) {
        return {
          success: true,
        };
      }

      const app = await getNodra();

      const token = extractSessionToken(ctx.request.headers, "session_token");

      if (token) {
        await app.auth.logout(token);
      }

      // Tell the HTTP transport to remove the cookie.
      ctx.state.set("clearSessionCookie", true);

      return {
        success: true,
      };
    },
    {
      requireAuth: true,
    },
  );
}
