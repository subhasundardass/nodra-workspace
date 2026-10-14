/**
 * `admin-reset` — app-scoped command.
 *
 * Run from an app workspace, for example:
 *
 *   pnpm --filter bizdir cli admin-reset \
 *     --username admin \
 *     --password 'test1234'
 *
 * Creates the admin user when it does not exist.
 * Resets the password (and re-enables the account) when it already exists.
 *
 * Passwords are stored using Argon2.
 */

import type { Command } from "commander";
import { Pool, type PoolClient } from "pg";
import argon2 from "argon2";

const USER_TABLE = '"tab_user"';
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_USER_TYPE = "System User";

/** Resolved PostgreSQL connection settings for the CLI. */
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

/** Raw CLI options as parsed by commander. */
interface AdminResetOptions {
  username: string;
  password: string;
  email?: string;
  userType: string;
}

/** Validated, normalized input for the command. */
interface AdminInput {
  username: string;
  password: string;
  email: string;
  userType: string;
}

type AdminResetResult = "created" | "updated";

/** Build the database config from `NODRA_DB_*` environment variables. */
function getDatabaseConfig(
  env: NodeJS.ProcessEnv = process.env,
): DatabaseConfig {
  return {
    host: env.NODRA_DB_HOST ?? "localhost",
    port: Number(env.NODRA_DB_PORT ?? 5432),
    database: env.NODRA_DB_DATABASE ?? "nodra",
    user: env.NODRA_DB_USER ?? "postgres",
    password: env.NODRA_DB_PASSWORD ?? "",
    pool: {
      min: Number(env.NODRA_DB_POOL_MIN ?? 2),
      max: Number(env.NODRA_DB_POOL_MAX ?? 10),
    },
  };
}

function createPool(config: DatabaseConfig): Pool {
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    min: config.pool.min,
    max: config.pool.max,
  });
}

/** Validate and normalize CLI options. Throws on invalid input. */
function parseInput(opts: AdminResetOptions): AdminInput {
  const username = opts.username.trim();
  const password = opts.password;

  if (!username) {
    throw new Error("Username cannot be empty");
  }
  if (!password) {
    throw new Error("Password cannot be empty");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  return {
    username,
    password,
    email: opts.email?.trim() || `${username}@localhost`,
    userType: opts.userType.trim() || DEFAULT_USER_TYPE,
  };
}

/** Run `fn` inside a transaction, rolling back on error. */
async function withTransaction<T>(
  pool: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Update an existing user's password and make sure the account is enabled. */
async function resetPassword(
  client: PoolClient,
  username: string,
  passwordHash: string,
): Promise<void> {
  await client.query(
    `UPDATE ${USER_TABLE}
        SET password = $1,
            enabled = true,
            modified = now(),
            modified_by = $2
      WHERE name = $2`,
    [passwordHash, username],
  );
}

/** Insert a new enabled admin user. */
async function insertAdmin(
  client: PoolClient,
  input: AdminInput,
  passwordHash: string,
): Promise<void> {
  await client.query(
    `INSERT INTO ${USER_TABLE} (
       name, owner, creation, modified, modified_by, docstatus, idx,
       email, first_name, full_name, enabled, password, user_type
     )
     VALUES ($1, $1, now(), now(), $1, 0, 0,
             $2, $1, $1, true, $3, $4)`,
    [input.username, input.email, passwordHash, input.userType],
  );
}

/** Create the admin user, or reset the password if it already exists. */
async function upsertAdmin(
  pool: Pool,
  input: AdminInput,
): Promise<AdminResetResult> {
  const passwordHash = await argon2.hash(input.password);

  return withTransaction(pool, async (client) => {
    const existing = await client.query(
      `SELECT name FROM ${USER_TABLE} WHERE name = $1 FOR UPDATE`,
      [input.username],
    );

    if (existing.rowCount && existing.rowCount > 0) {
      await resetPassword(client, input.username, passwordHash);
      return "updated";
    }

    await insertAdmin(client, input, passwordHash);
    return "created";
  });
}

/**
 * Register the `admin-reset` command on the given commander program.
 *
 * @param program - The commander program to attach the command to.
 */
export function registerAdminResetCommand(program: Command): void {
  program
    .command("admin-reset")
    .description(
      "Create an admin user or reset an existing admin user's password",
    )
    .requiredOption("--username <username>", "Admin username")
    .requiredOption("--password <password>", "Admin password")
    .option("--email <email>", "Email for a newly created user")
    .option(
      "--user-type <type>",
      "user_type for a newly created user",
      DEFAULT_USER_TYPE,
    )
    .action(async (opts: AdminResetOptions) => {
      const input = parseInput(opts);
      const pool = createPool(getDatabaseConfig());

      try {
        console.log("Connecting to database...");
        await pool.query("SELECT 1");

        const result = await upsertAdmin(pool, input);

        console.log(
          result === "created"
            ? "Admin user created successfully."
            : "Admin password reset successfully.",
        );
        console.log(`Username: ${input.username}`);
      } finally {
        await pool.end();
      }
    });
}
