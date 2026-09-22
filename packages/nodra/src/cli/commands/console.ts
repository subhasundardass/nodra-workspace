/**
 * `console` — app-scoped REPL.
 *
 * Database configuration is loaded from the app environment through
 * Nodra's database configuration helper.
 */

import type { Command } from "commander";
import { Pool } from "pg";
import { ConsoleCommand } from "../console.js";
import { getDatabaseConfig } from "./migrate.js";

export function registerConsoleCommand(program: Command): void {
  program
    .command("console")
    .description("Interactive REPL with direct database access")
    .action(async () => {
      const config = getDatabaseConfig();

      const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        min: config.pool.min,
        max: config.pool.max,
      });

      await new ConsoleCommand(pool).execute([]);
    });
}
