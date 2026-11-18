import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { extractSessionToken } from "nodra/auth";

import { getNodra } from "@/server/nodra-app";

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = extractSessionToken(getRequestHeaders(), "session_token");

    if (!token) {
      return null;
    }

    const app = await getNodra();

    const session = await app.sessions.resolve(token);

    if (!session || session.subject.type !== "User") {
      return null;
    }

    const user = await app.asSystem(() =>
      app.orm.getDoc("User", session.subject.id),
    );

    if (!user.get("enabled")) {
      return null;
    }

    const rawRoles = user.get("roles") as Array<{ role: string }> | undefined;

    const roles = rawRoles?.map((item) => item.role).filter(Boolean) ?? [];

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
