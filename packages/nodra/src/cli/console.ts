/**
 * console command - Interactive REPL with Nodra API
 */

import type { Pool } from "pg";
import type { Command } from "./types.js";
import { toTableName } from "../core/doctype/naming.js";
import * as repl from "node:repl";

/**
 * ConsoleCommand starts an interactive REPL session with Nodra API.
 *
 * Database configuration is loaded by the app/framework and the
 * connected Pool is injected into this command.
 */
export class ConsoleCommand implements Command {
  name = "console";
  description = "Interactive REPL with Nodra API";

  constructor(private pool: Pool) {}

  /**
   * Create REPL context with Nodra API.
   */
  private createContext() {
    return {
      // Database connection pool
      pool: this.pool,

      /**
       * Get a single document by DocType and name.
       *
       * Example:
       *   await getDoc("User", "USER-0001")
       */
      getDoc: async (doctype: string, name: string) => {
        const tableName = toTableName(doctype);

        const result = await this.pool.query(
          `SELECT * FROM ${tableName} WHERE name = $1`,
          [name],
        );

        return result.rows[0] ?? null;
      },

      /**
       * Get a list of documents.
       *
       * Example:
       *   await getList("User")
       *   await getList("User", { limit: 10 })
       */
      getList: async (
        doctype: string,
        options?: {
          limit?: number;
          offset?: number;
        },
      ) => {
        const tableName = toTableName(doctype);

        const limit = options?.limit ?? 20;
        const offset = options?.offset ?? 0;

        const result = await this.pool.query(
          `SELECT * FROM ${tableName} LIMIT $1 OFFSET $2`,
          [limit, offset],
        );

        return result.rows;
      },

      /**
       * Execute a raw SQL query.
       *
       * Example:
       *   await query("SELECT * FROM tab_user")
       */
      query: async (sql: string, params?: unknown[]) => {
        return this.pool.query(sql, params);
      },

      /**
       * Show available console commands.
       */
      help: () => {
        console.log(`
Available commands:

  pool
    Database connection pool

  await getDoc(doctype, name)
    Get a single document

  await getList(doctype, options?)
    Get a list of documents

  await query(sql, params?)
    Execute a raw SQL query

  help()
    Show this help message

  .exit
    Exit the console

Examples:

  await getList("User")

  await getList("User", { limit: 10 })

  await getDoc("User", "USER-0001")

  await query("SELECT NOW()")

`);
      },
    };
  }

  /**
   * Execute the console command.
   */
  async execute(_args: string[]): Promise<void> {
    console.log("\n=== Nodra Console ===");
    console.log("Type 'help()' for available commands or '.exit' to quit\n");

    // Create REPL context
    const context = this.createContext();

    // Start REPL
    const replServer = repl.start({
      prompt: "nodra> ",
      useColors: true,
    });

    // Inject Nodra API
    Object.assign(replServer.context, context);

    // Wait for the REPL to exit.
    //
    // This allows the caller to cleanly close the database
    // connection pool after the user exits the console.
    await new Promise<void>((resolve) => {
      replServer.on("exit", () => {
        console.log("\nGoodbye!");
        resolve();
      });
    });
  }
}
