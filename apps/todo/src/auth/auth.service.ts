import {
  createSession,
  destroySession,
  getSession,
} from "@/session/session.server";
import type { ORM } from "nodra/orm/crud";
import argon2 from "argon2";

import { AuthRepository } from "./auth.repository";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class AuthService {
  private readonly authRepository: AuthRepository;

  constructor(orm: ORM) {
    this.authRepository = new AuthRepository(orm);
  }

  /**
   * Authenticate a user and create a session.
   */
  async login(email: string, password: string) {
    const user = await this.authenticate(email, password);
    await createSession({
      type: "USER",
      id: user.name,
    });

    return {
      id: user.name,
      email: user.get("email") as string,
      name: user.get("full_name") as string | null,
    };
  }

  /**
   * Destroy the current user session.
   */
  async logout() {
    await destroySession();
  }

  /**
   * Get the currently authenticated user.
   */
  async getCurrentUser() {
    const session = await getSession();

    if (!session || session.subject.type !== "USER") {
      return null;
    }

    const user = await this.authRepository.findByName(session.subject.id);

    if (!user) {
      await destroySession();
      return null;
    }

    if (user.get("enabled") !== true) {
      await destroySession();
      return null;
    }

    return {
      id: user.name,
      email: user.get("email") as string,
      name: user.get("full_name") as string | null,
    };
  }

  /**
   * Validate user credentials.
   */
  private async authenticate(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const enabled = user.get("enabled");
    const passwordHash = user.get("password");

    if (
      enabled !== true ||
      typeof passwordHash !== "string" ||
      passwordHash.length === 0
    ) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await argon2.verify(passwordHash, password);

    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    return user;
  }
}
