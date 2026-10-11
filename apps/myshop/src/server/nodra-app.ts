/**
 * Nodra application bootstrap for TanStack Start.
 *
<<<<<<< HEAD
 * This replaces the original Fastify-based `Nodra.boot()`, which did two
 * things: (1) connect the database and build the ORM/registry, and (2) spin
 * up a Fastify HTTP server with routes attached to it. TanStack Start *is*
 * the HTTP server now (Vite + Nitro), and routes live under
 * `src/routes/api/**`, so this file only keeps responsibility (1).
=======
 * TanStack Start handles the HTTP server and routing through
 * Vite + Nitro, with API routes living under `src/routes/api/**`.
 *
 * This file is responsible for initializing the database connection,
 * ORM, and registry.
>>>>>>> origin/core
 *
 * Import `getNodra()` from any server route to get a lazily-initialized,
 * request-shared singleton (db pool + registry + ORM).
 */

import { createRequire } from "node:module";
import path from "node:path";
<<<<<<< HEAD
import { Database } from "nodra/database/connection";
import { DocTypeRegistry } from "nodra/core/doctype/registry";
import { loadDocTypesFromDirectory } from "nodra/core/doctype/loader";
import { ORM } from "nodra/orm/crud";
import { createLogger, type Logger } from "nodra/utils/logger";
import { loadConfig, type NodraConfig } from "nodra/core/config";
import { AuthService } from "nodra/auth/auth";
import { ORMAuthUserRepository } from "nodra/auth/user-repository";
import { DefaultMethodRegistry, type MethodRegistry } from "nodra/api/method";
import { registerAppMethods } from "./methods";
import { RedisSessionStore, SessionManager } from "nodra/auth/session";
=======
import { Database } from "nodra/database/connection.js";
import { DocTypeRegistry } from "nodra/core/doctype/registry.js";
import { loadDocTypesFromDirectory } from "nodra/core/doctype/loader.js";
import {
  ORM,
  runWithSession,
  runAsAdministrator,
  type ORMOptions,
  type SessionContext,
} from "nodra/orm/crud.js";
import { createLogger, type Logger } from "nodra/utils/logger.js";
import { loadConfig, type NodraConfig } from "nodra/core/config.js";
import {
  DefaultMethodRegistry,
  type MethodRegistry,
} from "nodra/api/method.js";
import { registerAppMethods } from "./methods.js";
import { AuthService } from "nodra/auth/auth.js";
import { ORMAuthUserRepository } from "nodra/auth/user-repository.js";
import { RedisSessionStore, SessionManager } from "nodra/auth/session.js";
import { ResourceAPI } from "nodra";
>>>>>>> origin/core

const require = createRequire(import.meta.url);

/**
 * Absolute path to `packages/nodra/doctypes` regardless of how `nodra` was
 * resolved (workspace symlink today, hoisted/published package later).
 * `require.resolve` always works here, unlike `import.meta.resolve`, which
 * needs a newer Node than this project otherwise requires.
 */
function frameworkDoctypesDir(): string {
  const nodraPackageJson = require.resolve("nodra/package.json");
  return path.join(path.dirname(nodraPackageJson), "doctypes");
}

/** Read a boolean env flag: "1"/"true" = on, "0"/"false" = off, unset = fallback. */
function flag(name: string, fallback: boolean): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === undefined || v === "") return fallback;
  return v === "1" || v === "true" || v === "yes";
}

function ormOptionsFromEnv(): ORMOptions {
  return {
    staleCheck: flag("NODRA_STALE_CHECK", true),
    enforcePermissions: flag("NODRA_ENFORCE_PERMISSIONS", false),
    childTables: flag("NODRA_CHILD_TABLES", false),
    validateLinks: flag("NODRA_VALIDATE_LINKS", false),
  };
}

export class NodraApp {
  readonly config: NodraConfig;
  readonly db: Database;
  readonly registry: DocTypeRegistry;
  readonly orm: ORM;
  readonly logger: Logger;
  readonly methods: MethodRegistry;
<<<<<<< HEAD
=======
  readonly resource: ResourceAPI;
  readonly ormOptions: ORMOptions;
>>>>>>> origin/core
  readonly sessions: SessionManager;
  readonly auth: AuthService;

  private constructor(config: NodraConfig) {
    this.config = config;
    this.db = new Database(config.db);
    this.registry = new DocTypeRegistry();
<<<<<<< HEAD
    this.orm = new ORM(this.db, this.registry);
=======
    this.ormOptions = ormOptionsFromEnv();
    this.orm = new ORM(this.db, this.registry, this.ormOptions);
    this.resource = new ResourceAPI(this.orm, this.registry);
>>>>>>> origin/core
    this.logger = createLogger(config.logging);
    this.methods = new DefaultMethodRegistry();

    const sessionStore = new RedisSessionStore(
<<<<<<< HEAD
      process.env.REDIS_URL ?? "redis://localhost:6380",
      "myapp",
=======
      process.env.REDIS_URL ?? "redis://localhost:6379",
      "yourkey:",
>>>>>>> origin/core
    );
    this.sessions = new SessionManager(sessionStore);

    const users = new ORMAuthUserRepository(this.orm);
    this.auth = new AuthService(users, this.sessions);
<<<<<<< HEAD
=======
  }

  /**
   * Run `fn` as the given user. Everything the ORM does inside (including
   * awaited calls) sees this user for owner / modified_by and permissions.
   */
  withSession<T>(ctx: SessionContext, fn: () => T): T {
    return runWithSession(ctx, fn);
  }

  /**
   * Run `fn` as Administrator (bypasses permissions). Use for login lookups,
   * seeders, migrations and background jobs.
   */
  asSystem<T>(fn: () => T): T {
    return runAsAdministrator(fn);
>>>>>>> origin/core
  }

  static async create(): Promise<NodraApp> {
    const config = await loadConfig(process.cwd());
    const app = new NodraApp(config);

    await app.db.connect();
    app.logger.info("Database connected");

    const frameworkDir = frameworkDoctypesDir();
    const appDir = path.join(process.cwd(), "doctypes");

    console.log("Framework DocTypes directory:", frameworkDir);
    console.log("App DocTypes directory:", appDir);

    // Doctype metadata: framework built-ins (User, Role, ...) from the
    // `nodra` package, then this app's own doctypes — in that order, so
    // app doctypes can safely `Link` to framework ones. Both directories
    // are optional; a missing one just yields an empty array.
    const [frameworkDoctypes, appDoctypes] = await Promise.all([
      loadDocTypesFromDirectory(frameworkDoctypesDir()),
      loadDocTypesFromDirectory(path.join(process.cwd(), "doctypes")),
    ]);

    for (const doctype of [...frameworkDoctypes, ...appDoctypes]) {
      app.registry.register(doctype);
    }
    app.logger.info(
      `Loaded ${frameworkDoctypes.length} framework doctype(s), ${appDoctypes.length} app doctype(s)`,
    );
    app.logger.info(`ORM options: ${JSON.stringify(app.ormOptions)}`);

    registerAppMethods(app.methods);

    return app;
  }
}

// ---------------------------------------------------------------------------
// Process-wide singleton
// ---------------------------------------------------------------------------
//
// TanStack Start's Nitro/Node server keeps one long-lived process per
// deployment target (unlike edge/serverless runtimes that cold-start per
// request). A module-scoped promise is enough to make sure `db.connect()`
// only runs once and every server route awaits the same instance.

let instance: Promise<NodraApp> | null = null;

export function getNodra(): Promise<NodraApp> {
  if (!instance) {
    instance = NodraApp.create().catch((err) => {
      // Allow a retry on the next request if boot failed (e.g. DB was down).
      instance = null;
      throw err;
    });
  }
  return instance;
}
