import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { extractSessionToken } from "nodra/auth";

import { getNodra } from "@/server/nodra-app";

const SESSION_COOKIE = "session_token";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  userType: string;
  roles: string[];
  expiresAt: Date;
};

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => {
    const token = extractSessionToken(getRequestHeaders(), SESSION_COOKIE);
    if (!token) return null;

    const app = await getNodra();

    let session;
    try {
      session = await app.sessions.resolve(token);
    } catch {
      return null;
    }

    if (!session || session.subject.type !== "User") return null;

    let user;
    try {
      user = await app.asSystem(() =>
        app.orm.getDoc("User", session.subject.id),
      );
    } catch {
      return null;
    }

    if (user.get("enabled") !== true) return null;

    const rawRoles = user.get("roles");
    const roles = Array.isArray(rawRoles)
      ? rawRoles
          .map((r) =>
            typeof r === "string" ? r : (r as { role?: string })?.role,
          )
          .filter((r): r is string => typeof r === "string" && r.length > 0)
      : [];

    return {
      id: session.subject.id,
      email: String(user.get("email") ?? ""),
      fullName: String(user.get("full_name") ?? ""),
      userType: String(user.get("user_type") ?? ""),
      roles,
      expiresAt: session.expiresAt,
    };
  },
);
