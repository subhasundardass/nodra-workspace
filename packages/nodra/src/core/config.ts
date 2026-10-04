/**
 * Nodra Framework - Configuration System
 *
 * Loads configuration from defaults, file overrides, and environment variables.
 * Priority: env vars > file config > defaults.
 */

import { ValidationError } from "./errors";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
// --- Types ---

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  pool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
}

export interface ServerConfig {
  host: string;
  port: number;
}

export interface AuthConfig {
  /** Name of the HTTP-only session cookie. */
  cookieName: string;
  /** Session lifetime in seconds. */
  sessionTtlSeconds: number;
  /** Extend sessions that are past half of their lifetime. */
  sessionSliding: boolean;
  passwordHashRounds: number;
}

export interface RedisConfig {
  url: string;
  /** Optional key prefix, useful when sharing one Redis between apps. */
  keyPrefix: string;
}

export interface JobsConfig {
  concurrency: number;
  retryLimit: number;
  retryDelay: number;
}

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "json" | "pretty";

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
}

export interface NodraConfig {
  db: DatabaseConfig;
  server: ServerConfig;
  auth: AuthConfig;
  redis: RedisConfig;
  jobs: JobsConfig;
  logging: LoggingConfig;
  installedApps: string[];
}

// --- Deep partial type for overrides ---

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NodraConfigOverride = DeepPartial<NodraConfig>;

// --- Defaults ---

export function getDefaults(): NodraConfig {
  return {
    db: {
      host: "localhost",
      port: 5432,
      database: "",
      user: "postgres",
      password: "",
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
      },
    },
    server: {
      host: "0.0.0.0",
      port: 8000,
    },
    auth: {
      cookieName: "session_token",
      sessionTtlSeconds: 60 * 60 * 24 * 7,
      sessionSliding: true,
      passwordHashRounds: 12,
    },
    redis: {
      url: "redis://localhost:6379",
      keyPrefix: "",
    },
    jobs: {
      concurrency: 5,
      retryLimit: 3,
      retryDelay: 60000,
    },
    logging: {
      level: "info",
      format: "json",
    },
    installedApps: ["nodra"],
  };
}

// --- Deep merge utility ---

function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  const result = { ...target } as Record<string, unknown>;
  const src = source as Record<string, unknown>;

  for (const key of Object.keys(src)) {
    const sourceVal = src[key];
    const targetVal = result[key];

    if (
      sourceVal !== undefined &&
      typeof sourceVal === "object" &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === "object" &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal,
        sourceVal as DeepPartial<typeof targetVal>,
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result as T;
}

// --- Environment variable loading ---

const ENV_MAP: Record<string, (config: NodraConfig, value: string) => void> = {
  NODRA_DB_HOST: (c, v) => {
    c.db.host = v;
  },
  NODRA_DB_PORT: (c, v) => {
    c.db.port = parseInt(v, 10);
  },
  NODRA_DB_DATABASE: (c, v) => {
    c.db.database = v;
  },
  NODRA_DB_USER: (c, v) => {
    c.db.user = v;
  },
  NODRA_DB_PASSWORD: (c, v) => {
    c.db.password = v;
  },
  NODRA_DB_POOL_MIN: (c, v) => {
    c.db.pool.min = parseInt(v, 10);
  },
  NODRA_DB_POOL_MAX: (c, v) => {
    c.db.pool.max = parseInt(v, 10);
  },
  NODRA_SERVER_HOST: (c, v) => {
    c.server.host = v;
  },
  NODRA_SERVER_PORT: (c, v) => {
    c.server.port = parseInt(v, 10);
  },
  NODRA_AUTH_COOKIE_NAME: (c, v) => {
    c.auth.cookieName = v;
  },
  NODRA_AUTH_SESSION_TTL: (c, v) => {
    c.auth.sessionTtlSeconds = parseInt(v, 10);
  },
  NODRA_AUTH_SESSION_SLIDING: (c, v) => {
    c.auth.sessionSliding = v !== "false" && v !== "0";
  },
  // REDIS_URL is accepted too, matching what hosting platforms inject.
  REDIS_URL: (c, v) => {
    c.redis.url = v;
  },
  NODRA_REDIS_URL: (c, v) => {
    c.redis.url = v;
  },
  NODRA_REDIS_KEY_PREFIX: (c, v) => {
    c.redis.keyPrefix = v;
  },
  NODRA_LOGGING_LEVEL: (c, v) => {
    c.logging.level = v as LogLevel;
  },
  NODRA_LOGGING_FORMAT: (c, v) => {
    c.logging.format = v as LogFormat;
  },
};

function applyEnvOverrides(config: NodraConfig): void {
  for (const [envKey, setter] of Object.entries(ENV_MAP)) {
    const value = process.env[envKey];
    if (value !== undefined && value !== "") {
      setter(config, value);
    }
  }
}

/**
 * Load a config file from the given directory, if present.
 *
 * Returns an empty object when no config file exists.
 * Throws when a config file exists but doesn't export an object.
 */
async function loadConfigFile(appDir: string): Promise<NodraConfigOverride> {
  for (const name of CONFIG_FILENAMES) {
    const configPath = resolve(appDir, name);

    if (!existsSync(configPath)) {
      continue;
    }

    const mod = await import(/* @vite-ignore */ pathToFileURL(configPath).href);
    const exported = mod.default ?? mod.config ?? {};

    if (
      typeof exported !== "object" ||
      exported === null ||
      Array.isArray(exported)
    ) {
      throw new ValidationError(
        `${name} must export a configuration object as its default export`,
      );
    }

    return exported as NodraConfigOverride;
  }

  return {};
}

// --- Public API ---

const CONFIG_FILENAMES = [
  "nodra.config.ts",
  "nodra.config.js",
  "nodra.config.mjs",
];

export async function loadConfig(
  appDir: string,
  overrides: NodraConfigOverride = {},
): Promise<NodraConfig> {
  const fileConfig = await loadConfigFile(appDir);

  const defaults = getDefaults();

  const config = deepMerge(
    deepMerge(defaults, fileConfig),
    overrides,
  ) as NodraConfig;

  applyEnvOverrides(config);
  validateConfig(config);

  return config;
}

const VALID_LOG_LEVELS = new Set<string>(["debug", "info", "warn", "error"]);

export function validateConfig(config: NodraConfig): void {
  const errors: string[] = [];

  if (!config.db.database) {
    errors.push("db.database is required");
  }
  if (!config.redis.url) {
    errors.push("redis.url is required (sessions are stored in Redis)");
  }
  if (!(config.auth.sessionTtlSeconds > 0)) {
    errors.push("auth.sessionTtlSeconds must be a positive number");
  }
  if (config.db.port < 1 || config.db.port > 65535) {
    errors.push("db.port must be between 1 and 65535");
  }
  if (config.server.port < 0 || config.server.port > 65535) {
    errors.push("server.port must be between 0 and 65535");
  }
  if (!VALID_LOG_LEVELS.has(config.logging.level)) {
    errors.push(
      `logging.level must be one of: ${[...VALID_LOG_LEVELS].join(", ")}`,
    );
  }
  if (config.db.pool.min > config.db.pool.max) {
    errors.push("db.pool.min cannot be greater than db.pool.max");
  }

  if (errors.length > 0) {
    throw new ValidationError(`Invalid configuration: ${errors.join("; ")}`, {
      details: errors.map((msg) => ({
        field: msg.split(" ")[0] ?? "config",
        message: msg,
      })),
    });
  }
}
