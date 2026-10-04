/**
 * Auth for server functions.
 *
 * These are *function* middleware (attached via `.middleware([...])` on a
 * `createServerFn()`), not the *request* middleware TanStack Start also has
 * for server routes. Function middleware doesn't receive a raw `Request` —
 * there's no route being matched, just a function being called — so the
 * bearer token is read via `getRequestHeader()`, an ambient helper that
 * reads the current request's headers out of the async-local-storage
 * context Start maintains for the duration of the call.
 *
 * `assertResourcePermission` is unchanged in spirit from the REST-route
 * version: still a plain function (not itself middleware) so it can take
 * the doctype/document name as real arguments instead of trying to parse
 * them back out of something ambient.
 */
import { createMiddleware } from "@tanstack/react-start";
import {
  getRequestHeader,
  getRequestHeaders,
} from "@tanstack/react-start/server";
import { getNodra, type NodraApp } from "./nodra-app";
import { extractSessionToken } from "nodra/auth";
import {
  hasPermission,
  getRoleHierarchy,
  type PermissionAction,
  type UserContext,
} from "nodra/permissions/permission";
import { logPermissionCheck } from "nodra/permissions/audit-log";
import {
  AuthenticationError,
  NotFoundError,
  PermissionError,
} from "nodra/core/errors";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  userType: string;
}

/** Attach the user if a valid token is present; never rejects the call. */
export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = extractSessionToken(getRequestHeaders(), "session_token");

    if (!token) {
      throw new AuthenticationError("Authentication required");
    }

    const app = await getNodra();

    const session = await app.sessions.resolve(token);

    if (!session) {
      throw new AuthenticationError("Session expired or invalid");
    }

    if (session.subject.type !== "User") {
      throw new AuthenticationError("Invalid session subject");
    }

    const user = await app.orm.getDoc("User", session.subject.id);

    if (!user.get("active")) {
      throw new AuthenticationError("User account is inactive");
    }

    return next({
      context: {
        user: {
          id: session.subject.id,
          email: user.get("email") as string,
          fullName: user.get("full_name") as string | undefined,
          userType: user.get("user_type") as string,
        },
      },
    });
  },
);

/** Attach the user if a valid token is present; never rejects the call. */
export const optionalAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = extractSessionToken(getRequestHeaders(), "session_token");

    let user: AuthUser | null = null;

    if (token) {
      try {
        const app = await getNodra();

        const session = await app.sessions.resolve(token);

        if (session && session.subject.type === "User") {
          const dbUser = await app.orm.getDoc("User", session.subject.id);

          if (dbUser.get("active")) {
            user = {
              id: session.subject.id,
              email: dbUser.get("email") as string,
              fullName: dbUser.get("full_name") as string | undefined,
              userType: dbUser.get("user_type") as string,
            };
          }
        }
      } catch {
        user = null;
      }
    }

    return next({
      context: { user },
    });
  },
);

async function getUserRoles(
  app: NodraApp,
  userEmail: string,
): Promise<string[]> {
  try {
    const user = await app.orm.getDoc("User", userEmail);
    const roles = user.get("roles") as Array<{ role: string }> | undefined;

    if (!roles || roles.length === 0) {
      return ["Guest"];
    }

    const userRoles = roles.map((r) => r.role);
    const hierarchy = await getRoleHierarchyFromDB(app);
    return getRoleHierarchy(userRoles, hierarchy);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new AuthenticationError("User not found");
    }
    throw error;
  }
}

async function getRoleHierarchyFromDB(
  app: NodraApp,
): Promise<Map<string, string>> {
  const hierarchy = new Map<string, string>();

  try {
    const roles = await app.orm.getList("Role", { filters: { disabled: 0 } });
    for (const role of roles) {
      const parentRole = role.get("parent_role") as string | undefined;
      const roleName = role.get("role_name") as string;
      if (parentRole) {
        hierarchy.set(roleName, parentRole);
      }
    }
  } catch {
    // Role DocType may not exist yet — treat as an empty hierarchy.
  }

  return hierarchy;
}

/**
 * Check that `user` may perform `action` on `doctypeName` (optionally
 * against a specific document, for owner-based write/delete checks), and
 * log the permission check. Throws AuthenticationError / NotFoundError /
 * PermissionError on failure — thrown errors reject the server function
 * call, so the client sees them as a rejected promise.
 */
export async function assertResourcePermission(
  app: NodraApp,
  user: AuthUser | null,
  action: PermissionAction,
  doctypeName: string,
  docName: string | undefined,
): Promise<void> {
  if (!user) {
    throw new AuthenticationError("Authentication required");
  }

  let doctype;
  try {
    doctype = app.registry.get(doctypeName);
  } catch {
    throw new NotFoundError("DocType", doctypeName);
  }

  const roles = await getUserRoles(app, user.email);
  const userContext: UserContext = { email: user.email, roles };

  let documentOwner: string | undefined;
  if (["write", "delete"].includes(action) && docName) {
    try {
      const doc = await app.orm.getDoc(doctypeName, docName);
      documentOwner = doc.get("owner") as string;
    } catch {
      // Document not found — the caller will surface a proper NotFoundError itself.
    }
  }

  const hasPerm = hasPermission(doctype, action, userContext, documentOwner);

  await logPermissionCheck({
    userEmail: user.email,
    action,
    doctype: doctypeName,
    documentName: docName,
    result: hasPerm ? "Allowed" : "Denied",
    ipAddress:
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
  });

  if (!hasPerm) {
    throw new PermissionError(
      doctypeName,
      action,
      `You do not have permission to ${action} ${doctypeName}`,
    );
  }
}
