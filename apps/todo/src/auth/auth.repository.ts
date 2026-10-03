import type { ORM } from "nodra/orm/crud.js";

/**
 * Data-access layer for authentication.
 *
 * Provides user lookups required by the authentication service.
 */
export class AuthRepository {
  constructor(private readonly orm: ORM) {}

  /**
   * Find a user by email address.
   *
   * @param email - The user's email address.
   * @returns The user document or `null` if not found.
   */
  async findByEmail(email: string) {
    try {
      const users = await this.orm.getList("User", {
        filters: {
          email,
        },
        limit: 1,
      });

      return users[0] ?? null;
    } catch {
      console.log(
        "Database error occurred while finding user by email:",
        email,
      );
      return null;
    }
  }

  /**
   * Find a user by Nodra document name.
   *
   * @param name - The User document name.
   * @returns The user document or `null` if not found.
   */
  async findByName(name: string) {
    try {
      return await this.orm.getDoc("User", name);
    } catch {
      return null;
    }
  }
}
