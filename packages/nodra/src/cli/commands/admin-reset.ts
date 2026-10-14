/**
 * `admin-reset` — app-scoped command.
 *
 * Run from an app workspace, for example:
 *
 *   pnpm --filter myshop cli admin-reset \
 *     --email admin@example.com \
 *     --password 'test1234'
 *
 * The User DocType is named by its `email` field (naming_field = email),
 * so the user's primary key (`name`) is the email address.
 * `--username admin` still works: it is used as the first name and, when no
 * `--email` is given, becomes `admin@localhost`.
 *
 * Creates the admin user when it does not exist.
 * Resets the password (and re-enables the account) when it already exists.
 * Makes sure the user has the admin role(s) in the User Role child table.
 *
 * The command reads the real columns of `tab_user` and `tab_user_role` at
 * runtime and only writes columns that exist. If a NOT NULL column has no
 * default and this command cannot fill it, it fails with a clear message.
 *
 * Passwords are stored using Argon2.
 */

import type { Command } from "commander";
import { Pool, type PoolClient } from "pg";
import argon2 from "argon2";
import { toTableName } from "../../core/doctype/naming";

const USER_TABLE = toTableName("User"); // tab_user
const USER_ROLE_TABLE = toTableName("User Role"); // tab_user_role
const ADMIN_ROLES = ["System Manager"];
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_USER_TYPE = "System Manager";

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
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password: string;
  userType: string;
}

/** Validated, normalized input for the command. */
interface AdminInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  userType: string;
}

interface ColumnMeta {
  column_name: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
}

type AdminResetResult = "created" | "updated";

/** Marker for "use the database's now()" instead of a bound parameter. */
const NOW = Symbol("now");
type Value = unknown | typeof NOW;
type Row = Record<string, Value>;

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
  const username = opts.username?.trim() ?? "";
  const emailOption = opts.email?.trim() ?? "";
  const password = opts.password;

  if (!username && !emailOption) {
    throw new Error("Provide --email (or --username)");
  }
  if (!password) {
    throw new Error("Password cannot be empty");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  const email = emailOption || `${username}@localhost`;
  const firstName =
    opts.firstName?.trim() || username || email.split("@")[0] || email;
  const lastName = opts.lastName?.trim() || null;

  return {
    email,
    password,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
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

// ---------------------------------------------------------------------------
// Schema-aware helpers
// ---------------------------------------------------------------------------

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Read the actual columns of a table. Empty array if the table is missing. */
async function getColumns(
  client: PoolClient,
  table: string,
): Promise<ColumnMeta[]> {
  const result = await client.query<ColumnMeta>(
    `
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = $1
    ORDER BY ordinal_position
    `,
    [table],
  );

  return result.rows;
}

/** Keep only entries whose column exists in the table. */
function filterToColumns(
  row: Row,
  columns: ColumnMeta[],
): Array<[string, Value]> {
  const names = new Set(columns.map((c) => c.column_name));

  return Object.entries(row).filter(
    ([column, value]) => names.has(column) && value !== undefined,
  );
}

/** Throw if a NOT NULL column without a default would be left unfilled. */
function assertRequiredColumnsFilled(
  table: string,
  columns: ColumnMeta[],
  filled: string[],
): void {
  const filledSet = new Set(filled);

  const missing = columns
    .filter(
      (c) =>
        c.is_nullable === "NO" &&
        c.column_default === null &&
        !filledSet.has(c.column_name),
    )
    .map((c) => c.column_name);

  if (missing.length > 0) {
    throw new Error(
      `${table} has required columns this command cannot fill: ` +
        `${missing.join(", ")}. Add them to admin-reset or give them a default.`,
    );
  }
}

/** INSERT a row, writing only columns that exist in the table. */
async function insertRow(
  client: PoolClient,
  table: string,
  columns: ColumnMeta[],
  row: Row,
): Promise<void> {
  const entries = filterToColumns(row, columns);

  assertRequiredColumnsFilled(
    table,
    columns,
    entries.map(([column]) => column),
  );

  const params: unknown[] = [];
  const placeholders = entries.map(([, value]) => {
    if (value === NOW) {
      return "now()";
    }
    params.push(value);
    return `$${params.length}`;
  });

  await client.query(
    `INSERT INTO ${quoteIdent(table)} (${entries
      .map(([column]) => quoteIdent(column))
      .join(", ")}) VALUES (${placeholders.join(", ")})`,
    params,
  );
}

/** UPDATE a row by name, writing only columns that exist in the table. */
async function updateRowByName(
  client: PoolClient,
  table: string,
  columns: ColumnMeta[],
  name: string,
  changes: Row,
): Promise<void> {
  const entries = filterToColumns(changes, columns);

  const params: unknown[] = [];
  const assignments = entries.map(([column, value]) => {
    if (value === NOW) {
      return `${quoteIdent(column)} = now()`;
    }
    params.push(value);
    return `${quoteIdent(column)} = $${params.length}`;
  });

  params.push(name);

  await client.query(
    `UPDATE ${quoteIdent(table)} SET ${assignments.join(", ")} ` +
      `WHERE name = $${params.length}`,
    params,
  );
}

// ---------------------------------------------------------------------------
// User + roles
// ---------------------------------------------------------------------------

/**
 * Make sure the user has every admin role in the User Role child table.
 * `userName` is the user's primary key (`name`), which is the child's `parent`.
 */
async function ensureRoles(
  client: PoolClient,
  userName: string,
): Promise<string[]> {
  const columns = await getColumns(client, USER_ROLE_TABLE);
  const names = new Set(columns.map((c) => c.column_name));

  if (columns.length === 0) {
    console.warn(
      `Table ${USER_ROLE_TABLE} not found, skipping role assignment.`,
    );
    return [];
  }

  if (!names.has("parent") || !names.has("role")) {
    console.warn(
      `Table ${USER_ROLE_TABLE} has no parent/role columns, ` +
        `skipping role assignment.`,
    );
    return [];
  }

  const granted: string[] = [];

  for (const role of ADMIN_ROLES) {
    const existing = await client.query(
      `SELECT 1 FROM ${quoteIdent(USER_ROLE_TABLE)}
        WHERE parent = $1 AND role = $2`,
      [userName, role],
    );

    if (existing.rowCount && existing.rowCount > 0) {
      continue;
    }

    await insertRow(client, USER_ROLE_TABLE, columns, {
      name: `${userName}-role-${role}`,
      owner: userName,
      creation: NOW,
      modified: NOW,
      modified_by: userName,
      docstatus: 0,
      idx: 0,
      parent: userName,
      parenttype: "User",
      parentfield: "roles",
      role,
    });

    granted.push(role);
  }

  return granted;
}

interface UpsertOutcome {
  result: AdminResetResult;
  userName: string;
  rolesGranted: string[];
}

/** Create the admin user, or reset the password if it already exists. */
async function upsertAdmin(
  pool: Pool,
  input: AdminInput,
): Promise<UpsertOutcome> {
  const passwordHash = await argon2.hash(input.password);

  return withTransaction(pool, async (client) => {
    const columns = await getColumns(client, USER_TABLE);

    if (columns.length === 0) {
      throw new Error(
        `Table ${USER_TABLE} does not exist. Run "migrate" first.`,
      );
    }

    // Match on email (the naming field) or name, so a user created by an
    // older version of this command (name = "admin") is found and reused.
    const existing = await client.query<{ name: string }>(
      `SELECT name FROM ${quoteIdent(USER_TABLE)}
        WHERE email = $1 OR name = $1
          FOR UPDATE`,
      [input.email],
    );

    if ((existing.rowCount ?? 0) > 1) {
      throw new Error(
        `More than one user matches "${input.email}" by name or email. ` +
          `Resolve the duplicates first.`,
      );
    }

    const found = existing.rows[0];
    let result: AdminResetResult;
    let userName: string;

    if (found) {
      userName = found.name;

      await updateRowByName(client, USER_TABLE, columns, userName, {
        password: passwordHash,
        enabled: true,
        modified: NOW,
        modified_by: userName,
      });
      result = "updated";
    } else {
      // naming_rule = "field", naming_field = "email" → name is the email.
      userName = input.email;

      await insertRow(client, USER_TABLE, columns, {
        name: userName,
        owner: userName,
        creation: NOW,
        modified: NOW,
        modified_by: userName,
        docstatus: 0,
        idx: 0,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: input.fullName,
        enabled: true,
        user_type: input.userType,
        password: passwordHash,
      });
      result = "created";
    }

    const rolesGranted = await ensureRoles(client, userName);

    return { result, userName, rolesGranted };
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
    .option("--email <email>", "Admin email (the user's unique name)")
    .option(
      "--username <username>",
      "Short name; used as first name, and as <username>@localhost if no --email",
    )
    .requiredOption("--password <password>", "Admin password")
    .option("--first-name <name>", "First name for a newly created user")
    .option("--last-name <name>", "Last name for a newly created user")
    .option(
      "--user-type <type>",
      "user_type for a newly created user",
      DEFAULT_USER_TYPE,
    )
    .action(async (opts: AdminResetOptions) => {
      const pool = createPool(getDatabaseConfig());

      try {
        const input = parseInput(opts);

        console.log("Connecting to database...");
        await pool.query("SELECT 1");

        const { result, userName, rolesGranted } = await upsertAdmin(
          pool,
          input,
        );

        console.log(
          result === "created"
            ? "Admin user created successfully."
            : "Admin password reset successfully.",
        );
        console.log(`User: ${userName}`);

        if (rolesGranted.length > 0) {
          console.log(`Roles granted: ${rolesGranted.join(", ")}`);
        }
      } catch (error) {
        console.error(
          `admin-reset failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exitCode = 1;
      } finally {
        await pool.end();
      }
    });
}
