import type { ORM } from "nodra/orm/crud.js";

/**
 * Data-access layer for authentication.
 *
 * Wraps the Nodra ORM and exposes user lookups by username or id,
 * returning the user together with any relations required for auth.
 */
export class AuthRepository {
  constructor(private readonly orm: ORM) {}

  /**
   * Find a user by their username.
   *
   * @param username - The username to look up.
   * @returns The user (with relations) or `null` if not found.
   */
  async findByUsername(username: string) {
    const users = await this.orm.getList("User", {
      filters: {
        username,
      },
      limit: 1,
    });

    const user = users[0];

    if (!user) {
      return null;
    }

    return user;
  }

  /**
   * Find a user by their primary key.
   *
   * @param id - The user email.
   * @returns The user (with relations) or `null` if not found.
   */
  async findByEmail(email: string) {
    const users = await this.orm.getList("User", {
      filters: {
        email,
      },
      limit: 1,
    });

    return users[0] ?? null;
  }

  async findById(id: string) {
    return this.orm.getDoc("User", id);
  }
}
