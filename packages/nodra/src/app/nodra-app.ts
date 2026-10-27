/**
 * Nodra application bootstrap.
 *
 * Creates the database pool, DocType registry, controller registry, ORM,
 * sessions and method registry once per process.
 */

import { createRequire } from "node:module";
import path from "node:path";

import { Database } from "../database/connection";
import { DocTypeRegistry } from "../core/doctype/registry";
import { loadDocTypesFromDirectory } from "../core/doctype/loader";
import { registerFrameworkMethods } from "../methods";
import type { WorkflowActionHooks } from "../orm/workflow-hooks";
import { DocTypeControllerRegistry } from "./controller-registry";
import {
  ORM,
  runWithSession,
  runAsAdministrator,
  type ORMOptions,
  type SessionContext,
} from "../orm/crud";
import { createLogger, type Logger } from "../utils/logger";
import type { NodraConfig } from "../core/config";
import { DefaultMethodRegistry, type MethodRegistry } from "../api/method";
import { AuthService } from "../auth/auth";
import { ORMAuthUserRepository } from "../auth/user-repository";
import { RedisSessionStore, SessionManager } from "../auth/session";
import { ResourceAPI } from "../api/resource";
import { registerAppMethods } from "./identity";
import { discoverWorkflowHooks } from "../orm/workflow-hook-loader";

const require = createRequire(import.meta.url);

type Modules = Record<string, Record<string, unknown>>;

export interface NodraAppOptions {
  config: NodraConfig;
  /**
   * DocType controller modules discovered by import.meta.glob().
   */
  controllerModules?: Modules;

  /**
   * App method modules discovered by import.meta.glob().
   * Exported register<Name>Methods(registry) functions are called once.
   */
  methodModules?: Modules;

  workflowHookModules?: Modules;

  /**
   * Redis key prefix for sessions.
   */
  sessionKeyPrefix?: string;
}

function frameworkDoctypesDir(): string {
  const packageJson = require.resolve("nodra/package.json");
  return path.join(path.dirname(packageJson), "doctypes");
}

/**
 * Read a boolean environment flag.
 * Unset values use the fallback; supported true values are 1, true and yes.
 */
function flag(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (value === undefined || value === "") {
    return fallback;
  }

  if (["1", "true", "yes"].includes(value)) {
    return true;
  }

  if (["0", "false", "no"].includes(value)) {
    return false;
  }

  return fallback;
}

function ormOptionsFromEnv(workflowHooks?: WorkflowActionHooks): ORMOptions {
  return {
    staleCheck: flag("NODRA_STALE_CHECK", true),
    enforcePermissions: flag("NODRA_ENFORCE_PERMISSIONS", false),
    childTables: flag("NODRA_CHILD_TABLES", false),
    validateLinks: flag("NODRA_VALIDATE_LINKS", false),
    workflowHooks,
  };
}

export class NodraApp {
  readonly config: NodraConfig;
  readonly db: Database;
  readonly registry: DocTypeRegistry;
  readonly controllers: DocTypeControllerRegistry;
  readonly orm: ORM;
  readonly logger: Logger;
  readonly methods: MethodRegistry;
  readonly resource: ResourceAPI;
  readonly ormOptions: ORMOptions;
  readonly sessions: SessionManager;
  readonly auth: AuthService;

  private constructor(config: NodraConfig, options: NodraAppOptions) {
    this.config = config;
    this.db = new Database(config.db);

    this.registry = new DocTypeRegistry();
    this.controllers = new DocTypeControllerRegistry();
    const workflowHooks = discoverWorkflowHooks(
      options.workflowHookModules ?? {},
    );

    this.ormOptions = ormOptionsFromEnv(workflowHooks);
    this.orm = new ORM(this.db, this.registry, this.ormOptions);

    this.resource = new ResourceAPI(this.orm, this.registry, (doctype, data) =>
      this.controllers.create(this.registry.get(doctype), data),
    );

    this.logger = createLogger(config.logging);
    this.methods = new DefaultMethodRegistry();

    const sessionStore = new RedisSessionStore(
      config.redis.url,
      options.sessionKeyPrefix ?? config.redis.keyPrefix,
    );

    this.sessions = new SessionManager(sessionStore);

    const users = new ORMAuthUserRepository(this.orm);
    this.auth = new AuthService(users, this.sessions);
  }

  /**
   * Run ORM operations within a user's session context.
   */
  withSession<T>(ctx: SessionContext, fn: () => T): T {
    return runWithSession(ctx, fn);
  }

  /**
   * Run operations as Administrator, bypassing permissions.
   */
  asSystem<T>(fn: () => T): T {
    return runAsAdministrator(fn);
  }

  static async create(options: NodraAppOptions): Promise<NodraApp> {
    // const config = await loadConfig(process.cwd());
    const app = new NodraApp(options.config, options);

    await app.db.connect();
    app.logger.info("Database connected");

    // Load framework and application DocTypes.
    const [frameworkDoctypes, appDoctypes] = await Promise.all([
      loadDocTypesFromDirectory(frameworkDoctypesDir()),
      loadDocTypesFromDirectory(path.join(process.cwd(), "doctypes")),
    ]);

    const doctypes = [...frameworkDoctypes, ...appDoctypes];

    // Register all metadata before resolving controllers.
    for (const doctype of doctypes) {
      app.registry.register(doctype);
    }

    // Register custom Document subclasses.
    app.controllers.registerModules(doctypes, options.controllerModules ?? {});

    app.logger.info(
      `Loaded ${frameworkDoctypes.length} framework DocType(s), ` +
        `${appDoctypes.length} application DocType(s)`,
    );

    app.logger.info(`ORM options: ${JSON.stringify(app.ormOptions)}`);

    // Register framework methods first, then application methods.
    registerFrameworkMethods(app.methods, {
      getApp: async () => app,
    });

    registerAppMethods(app, options.methodModules ?? {});

    return app;
  }
}

/**
 * Creates a process-wide singleton getter.
 * Concurrent callers share the same startup promise.
 * Failed startup attempts can be retried on the next call.
 */
export function createGetNodra(
  options: NodraAppOptions,
): () => Promise<NodraApp> {
  let instance: Promise<NodraApp> | null = null;

  return () => {
    if (!instance) {
      instance = NodraApp.create(options).catch((error: unknown) => {
        instance = null;
        throw error;
      });
    }

    return instance;
  };
}
