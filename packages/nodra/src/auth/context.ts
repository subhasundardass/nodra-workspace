import { UnauthorizedError } from "./errors";
import {
  extractSessionToken,
  type Session,
  type SessionManager,
} from "./session";
import type { PublicUser } from "./types";
import type { AuthUserRepository } from "./types";

export interface AuthContext {
  session: Session | null;
  user: PublicUser | null;

  isAuthenticated(): boolean;

  requireAuth(): {
    session: Session;
    user: PublicUser;
  };
}

export async function createAuthContext(
  headers: Headers,
  sessions: SessionManager,
  users: AuthUserRepository,
): Promise<AuthContext> {
  const token = extractSessionToken(headers);

  if (!token) {
    return {
      session: null,
      user: null,

      isAuthenticated() {
        return false;
      },

      requireAuth() {
        throw new UnauthorizedError();
      },
    };
  }

  const session = await sessions.resolve(token);

  if (!session) {
    return {
      session: null,
      user: null,

      isAuthenticated() {
        return false;
      },

      requireAuth() {
        throw new UnauthorizedError();
      },
    };
  }

  const user = await users.findById(session.subject.id);

  if (!user || !user.active) {
    await sessions.destroy(token);

    return {
      session: null,
      user: null,

      isAuthenticated() {
        return false;
      },

      requireAuth() {
        throw new UnauthorizedError();
      },
    };
  }

  const publicUser: PublicUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
  };

  return {
    session,
    user: publicUser,

    isAuthenticated() {
      return true;
    },

    requireAuth() {
      return {
        session: session!,
        user: publicUser!,
      };
    },
  };
}
