import type { ORM } from "../orm/crud";
import type { AuthUser, AuthUserRepository } from "./types";

export class ORMAuthUserRepository implements AuthUserRepository {
  constructor(private readonly orm: ORM) {}

  async findByUsername(username: string): Promise<AuthUser | null> {
    const identifier = username.trim();

    if (!identifier) {
      return null;
    }

    // First, try an exact email match.
    const emailUsers = await this.orm.getList("User", {
      filters: { email: identifier },
      limit: 1,
    });

    let user = emailUsers[0];

    // If no email matches, try the document name.
    if (!user) {
      try {
        user = await this.orm.getDoc("User", identifier);
      } catch {
        return null;
      }
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

  async updateLoginMetadata(
    id: string,
    lastLogin: Date,
    lastIp: string | null,
  ): Promise<void> {
    const user = await this.orm.getDoc("User", id);

    user.set("last_login", lastLogin);
    user.set("last_ip", lastIp);

    await this.orm.update(user);
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
