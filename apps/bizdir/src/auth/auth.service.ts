import {
  createSession,
  destroySession,
  getSession,
} from "@/session/session.server";
import { AuthRepository } from "./auth.repository";
import type { CurrentUser } from "./auth.types";
import type { ORM } from "nodra/orm/crud";
import argon2 from "argon2";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid username or password");
    this.name = "InvalidCredentialsError";
  }
}

export class AuthService {
  constructor(private readonly orm: ORM) {}

  async login(username: string, password: string) {
    const user = await this.authenticate(username, password);

    await createSession({
      type: "USER",
      id: String(user.name),
    });

    return {
      id: user.name,
      username: user.name,
      name: user.full_name,
      email: user.email,
    };
  }

  async logout() {
    await destroySession();
  }

  async getCurrentUser(): Promise<CurrentUser | null> {
    const session = await getSession();

    if (!session || session.subject.type !== "USER") {
      return null;
    }

    const authRepository = new AuthRepository(this.orm);

    const user = await authRepository.findById(session.subject.id);

    if (!user || !user.enabled) {
      return null;
    }

    return {
      id: user.name,
      username: user.name,
      name: user.full_name,
      email: user.email,
    };
  }

  private async authenticate(username: string, password: string) {
    const authRepository = new AuthRepository(this.orm);

    const user = await authRepository.findByUsername(username);

    if (!user || !user.enabled || !user.password) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await argon2.verify(user.password, password);

    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
