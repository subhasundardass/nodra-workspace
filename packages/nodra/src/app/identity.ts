import {
  authenticate,
  type MethodContext,
  type MethodRegistry,
  type ResolvedIdentity,
} from "../api/method";
import { extractSessionToken } from "../auth/session";
import { runWithSession } from "../orm/crud";
import type { NodraApp } from "./nodra-app";

type MethodModules = Record<string, Record<string, unknown>>;

async function resolveMethodIdentity(
  app: NodraApp,
  ctx: MethodContext,
): Promise<ResolvedIdentity | null> {
  const token = extractSessionToken(ctx.request.headers, "session_token");

  if (!token) return null;

  const session = await app.sessions.resolve(token);

  if (!session || session.subject.type !== "User") {
    return null;
  }

  const user = await app.asSystem(() =>
    app.orm.getDoc("User", session.subject.id),
  );

  if (!user.get("enabled")) return null;

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

function registerGeneratedMethods(
  registry: MethodRegistry,
  modules: MethodModules,
): void {
  for (const [file, mod] of Object.entries(modules)) {
    for (const [name, fn] of Object.entries(mod)) {
      if (!/^register\w+Methods$/.test(name) || typeof fn !== "function") {
        continue;
      }

      (fn as (registry: MethodRegistry) => void)(registry);
    }
  }
}

export function registerAppMethods(
  app: NodraApp,
  modules: MethodModules = {},
): void {
  app.methods.use(authenticate((ctx) => resolveMethodIdentity(app, ctx)));

  app.methods.use((ctx, next) => {
    const { user, session } = ctx;

    if (!user || !session || session.subject.type !== "User") {
      return next();
    }

    return runWithSession(
      {
        user: session.subject.id,
        roles: user.roles,
      },
      () => next(),
    );
  });

  registerGeneratedMethods(app.methods, modules);
}
