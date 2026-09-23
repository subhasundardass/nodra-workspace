/**
 * Nodra application bootstrap for TanStack Start.
 *
 * This replaces the original Fastify-based `Nodra.boot()`, which did two
 * things: (1) connect the database and build the ORM/registry, and (2) spin
 * up a Fastify HTTP server with routes attached to it. TanStack Start *is*
 * the HTTP server now (Vite + Nitro), and routes live under
 * `src/routes/api/**`, so this file only keeps responsibility (1).
 *
 * Import `getNodra()` from any server route to get a lazily-initialized,
 * request-shared singleton (db pool + registry + ORM).
 */
import { createRequire } from "node:module";
import path from "node:path";
import { Database } from "nodra/database/connection.js";
import { DocTypeRegistry } from "nodra/core/doctype/registry.js";
import { loadDocTypesFromDirectory } from "nodra/core/doctype/loader.js";
import { ORM } from "nodra/orm/crud.js";
import { createLogger, type Logger } from "nodra/utils/logger.js";
import { loadConfig, type NodraConfig } from "nodra/core/config.js";
import {
  DefaultMethodRegistry,
  type MethodRegistry,
} from "nodra/api/method.js";
import { registerAppMethods } from "./methods.js";

import { ResourceAPI } from "nodra";

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

export class NodraApp {
  readonly config: NodraConfig;
  readonly db: Database;
  readonly registry: DocTypeRegistry;
  readonly orm: ORM;
  readonly resource: ResourceAPI;
  readonly logger: Logger;
  readonly methods: MethodRegistry;

  private constructor(config: NodraConfig) {
    this.config = config;
    this.db = new Database(config.db);
    this.registry = new DocTypeRegistry();
    this.orm = new ORM(this.db, this.registry);
    this.resource = new ResourceAPI(this.orm, this.registry);
    this.logger = createLogger(config.logging);
    this.methods = new DefaultMethodRegistry();
  }

  static async create(): Promise<NodraApp> {
    const config = await loadConfig(process.cwd());
    const app = new NodraApp(config);

    await app.db.connect();
    app.logger.info("Database connected");

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
