/**
 * `migrate` — app-scoped command.
 *
 * Run from an app workspace, for example:
 *
 *   pnpm --filter mfi cli migrate
 *
 * Database configuration is loaded from the Nodra environment:
 *
 *   NODRA_DB_HOST
 *   NODRA_DB_PORT
 *   NODRA_DB_DATABASE
 *   NODRA_DB_USER
 *   NODRA_DB_PASSWORD
 *   NODRA_DB_POOL_MIN
 *   NODRA_DB_POOL_MAX
 *
 * `MigrateCommand` uses the app's `./doctypes` directory by default.
 *
 * Commander handles option parsing and `--help` generation.
 */

import type { Command } from "commander";
import { Pool } from "pg";
import { MigrateCommand } from "../migrate.js";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  pool: {
    min: number;
    max: number;
  };
}

let dbConfig: DatabaseConfig | null = null;

export function getDatabaseConfig(): DatabaseConfig {
  if (dbConfig) {
    return dbConfig;
  }

  dbConfig = {
    host: process.env.NODRA_DB_HOST ?? "localhost",
    port: Number(process.env.NODRA_DB_PORT ?? 5432),
    database: process.env.NODRA_DB_DATABASE ?? "nodra",
    user: process.env.NODRA_DB_USER ?? "postgres",
    password: process.env.NODRA_DB_PASSWORD ?? "",
    pool: {
      min: Number(process.env.NODRA_DB_POOL_MIN ?? 2),
      max: Number(process.env.NODRA_DB_POOL_MAX ?? 10),
    },
  };

  return dbConfig;
}

export function registerMigrateCommand(program: Command): void {
  program
    .command("migrate")
    .description("Sync this app's DocType definitions to the database schema")
    .option("--verbose", "Show detailed migration information")
    .action(async (opts: { verbose?: boolean }) => {
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

      const args: string[] = [];

      if (opts.verbose) {
        args.push("--verbose");
      }

      try {
        console.log("Migrating app...");
        await new MigrateCommand(pool).execute(args);
      } finally {
        await pool.end();
      }
    });
}
