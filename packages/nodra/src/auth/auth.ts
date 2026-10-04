import { InvalidCredentialsError, UnauthorizedError } from "./errors";
import {
  type AuthUser,
  type AuthUserRepository,
  type LoginInput,
  type LoginResult,
  type PublicUser,
} from "./types";
import { SessionManager, type SessionSubject } from "./session";
import { verifyPassword } from "./password";

function toPublicUser(user: AuthUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
  };
}

export class AuthService {
  constructor(
    private readonly users: AuthUserRepository,
    private readonly sessions: SessionManager,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const username = input.username.trim();

    if (!username || !input.password) {
      throw new InvalidCredentialsError();
    }

    const user = await this.users.findByUsername(username);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await verifyPassword(
      user.passwordHash,
      input.password,
    );

    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    const subject: SessionSubject = {
      type: "User",
      id: user.id,
    };

    const result = await this.sessions.create(subject, {
      username: user.username,
    });

    return {
      user: toPublicUser(user),
      token: result.token,
      expiresAt: result.session.expiresAt,
    };
  }

  async authenticate(token: string) {
    if (!token) {
      throw new UnauthorizedError();
    }

    return this.sessions.require(token);
  }

  async logout(token: string): Promise<void> {
    if (!token) {
      return;
    }

    await this.sessions.destroy(token);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessions.destroyAll({
      type: "User",
      id: userId,
    });
  }

  async getUserFromSession(token: string): Promise<PublicUser> {
    const session = await this.sessions.require(token);

    const user = await this.users.findById(session.subject.id);

    if (!user || !user.active) {
      await this.sessions.destroy(token);
      throw new UnauthorizedError();
    }

    return toPublicUser(user);
  }
}
