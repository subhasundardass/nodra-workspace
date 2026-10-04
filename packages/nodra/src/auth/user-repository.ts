import type { ORM } from "../orm/crud";
import type { AuthUser, AuthUserRepository } from "./types";

export class ORMAuthUserRepository implements AuthUserRepository {
  constructor(private readonly orm: ORM) {}

  async findByUsername(email: string): Promise<AuthUser | null> {
    const users = await this.orm.getList("User", {
      filters: { email },
      limit: 1,
    });

    const user = users[0];

    if (!user) {
      return null;
    }

    return this.toAuthUser(user);
  }

  async findById(id: string): Promise<AuthUser | null> {
    try {
      const user = await this.orm.getDoc("User", id);
      return this.toAuthUser(user);
    } catch {
      return null;
    }
  }

  private toAuthUser(user: {
    get(fieldname: string): unknown;
    name: string;
  }): AuthUser {
    return {
      id: user.name,
      username: String(user.get("email") ?? ""),
      email: String(user.get("email") ?? ""),
      name: String(user.get("full_name") ?? ""),
      passwordHash: String(user.get("password") ?? ""),
      active: Boolean(user.get("enabled")),
    };
  }
}
