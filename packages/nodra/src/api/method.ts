/**
 * Method Registry - whitelisted API methods with a MethodContext and a
 * middleware pipeline.
 *
 * Every call runs as:
 *
 *   global middleware (registry.use)        e.g. authenticate, logging
 *     -> access control (requireAuth / requiredRoles from the definition)
 *       -> per-method middleware (options.middleware)
 *         -> handler(ctx)
 *
 * Handlers receive a single `MethodContext` instead of positional args, so
 * the authenticated user, session, request info and arguments travel
 * together and middleware can enrich them for whatever runs next.
 *
 * Everything here is transport-agnostic: HTTP wiring (cookies, headers,
 * status codes) lives in the consuming app, which builds a `MethodCallInit`
 * and calls `registry.execute()`.
 */
import {
  AuthenticationError,
  NodraError,
  PermissionError,
  ValidationError,
} from "../core/errors";
import type { Session } from "../auth/session";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** The authenticated principal as seen by methods. */
export interface MethodUser {
  email: string;
  fullName?: string;
  userType?: string;
  roles: string[];
}

/** Minimal, framework-neutral view of the incoming request. */
export interface MethodRequest {
  /** HTTP verb, upper-case. */
  httpMethod: string;
  headers: { get(name: string): string | null | undefined };
  /** Client IP, if the transport knows it. */
  ip?: string;
}

export interface MethodContext<TArgs = Record<string, unknown>> {
  /** Dotted method path, e.g. "crm.get_pipeline_summary". */
  readonly method: string;
  readonly definition: MethodDefinition;
  readonly request: MethodRequest;
  /** Call arguments. Validation middleware may replace this with parsed data. */
  args: TArgs;
  /** Set by authentication middleware; `null` for anonymous calls. */
  user: MethodUser | null;
  session: Session | null;
  /** Per-call scratch space for middleware to share data. */
  readonly state: Map<string, unknown>;
  /** `Date.now()` when the call started. */
  readonly startedAt: number;
}

/** Everything a transport must supply to run a method. */
export interface MethodCallInit {
  args?: Record<string, unknown>;
  request: MethodRequest;
  user?: MethodUser | null;
  session?: Session | null;
  state?: Map<string, unknown>;
}

export type MethodHandler<
  TArgs = Record<string, unknown>,
  TResult = unknown,
> = (ctx: MethodContext<TArgs>) => TResult | Promise<TResult>;

/** Koa-style middleware. Call `next()` to continue, return its result (or your own). */
export type MethodMiddleware = (
  ctx: MethodContext,
  next: () => Promise<unknown>,
) => Promise<unknown> | unknown;

// ---------------------------------------------------------------------------
// Definition & registry
// ---------------------------------------------------------------------------

export interface MethodOptions {
  /** Require an authenticated user. Default: false. */
  requireAuth?: boolean;
  /** Caller needs at least one of these roles (implies requireAuth). */
  requiredRoles?: string[];
  /** Middleware that runs only for this method, after access control. */
  middleware?: MethodMiddleware[];
}

export interface MethodDefinition {
  handler: MethodHandler<any, unknown>;
  requireAuth: boolean;
  requiredRoles: string[];
  middleware: MethodMiddleware[];
}

export interface MethodRegistry {
  /** Register a whitelisted method. */
  register<TArgs = Record<string, unknown>>(
    path: string,
    handler: MethodHandler<TArgs>,
    options?: MethodOptions,
  ): void;
  /** Add global middleware (runs for every method, in registration order). */
  use(middleware: MethodMiddleware): this;
  get(path: string): MethodDefinition | undefined;
  has(path: string): boolean;
  /** Run a method through the full pipeline. */
  execute(path: string, init: MethodCallInit): Promise<unknown>;
}

const METHOD_PATH_PATTERN = /^[A-Za-z_][\w-]*(\.[A-Za-z_][\w-]*)*$/;

export class DefaultMethodRegistry implements MethodRegistry {
  private readonly methods = new Map<string, MethodDefinition>();
  private readonly globalMiddleware: MethodMiddleware[] = [];

  register<TArgs = Record<string, unknown>>(
    path: string,
    handler: MethodHandler<TArgs>,
    options: MethodOptions = {},
  ): void {
    if (!METHOD_PATH_PATTERN.test(path)) {
      throw new ValidationError(`Invalid method path "${path}"`);
    }
    if (this.methods.has(path)) {
      throw new ValidationError(`Method "${path}" is already registered`);
    }
    const requiredRoles = options.requiredRoles ?? [];
    this.methods.set(path, {
      handler,
      requireAuth: options.requireAuth ?? requiredRoles.length > 0,
      requiredRoles,
      middleware: options.middleware ?? [],
    });
  }

  use(middleware: MethodMiddleware): this {
    this.globalMiddleware.push(middleware);
    return this;
  }

  get(path: string): MethodDefinition | undefined {
    return this.methods.get(path);
  }

  has(path: string): boolean {
    return this.methods.has(path);
  }

  async execute(path: string, init: MethodCallInit): Promise<unknown> {
    const definition = this.methods.get(path);
    if (!definition) {
      // Same error for "unknown" and "not whitelisted": don't leak what exists.
      throw new NodraError(`Method "${path}" not found`, 404);
    }

    const ctx: MethodContext = {
      method: path,
      definition,
      request: init.request,
      args: init.args ?? {},
      user: init.user ?? null,
      session: init.session ?? null,
      state: init.state ?? new Map(),
      startedAt: Date.now(),
    };

    const pipeline: MethodMiddleware[] = [
      ...this.globalMiddleware,
      accessControl,
      ...definition.middleware,
    ];

    return compose(pipeline, (c) => definition.handler(c))(ctx);
  }

  /** Clear all registered methods and global middleware (for tests). */
  clear(): void {
    this.methods.clear();
    this.globalMiddleware.length = 0;
  }
}

/**
 * Compose middleware into a single function. Guards against `next()` being
 * called more than once from the same middleware.
 */
export function compose(
  middleware: MethodMiddleware[],
  final: (ctx: MethodContext) => unknown,
): (ctx: MethodContext) => Promise<unknown> {
  return (ctx) => {
    let lastIndex = -1;

    const dispatch = async (i: number): Promise<unknown> => {
      if (i <= lastIndex) {
        throw new Error("next() called multiple times in method middleware");
      }
      lastIndex = i;

      const mw = middleware[i];
      if (!mw) return final(ctx);
      return mw(ctx, () => dispatch(i + 1));
    };

    return dispatch(0);
  };
}

// ---------------------------------------------------------------------------
// Built-in middleware
// ---------------------------------------------------------------------------

/** Check if user has any of the required roles. */
export function hasRequiredRole(
  user: Pick<MethodUser, "roles">,
  requiredRoles: string[],
): boolean {
  if (requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => user.roles.includes(role));
}

/** Enforces `requireAuth` / `requiredRoles` from the method definition. */
const accessControl: MethodMiddleware = (ctx, next) => {
  const { requireAuth, requiredRoles } = ctx.definition;

  if (requireAuth && !ctx.user) {
    throw new AuthenticationError("Authentication required");
  }
  if (
    requiredRoles.length > 0 &&
    (!ctx.user || !hasRequiredRole(ctx.user, requiredRoles))
  ) {
    throw new PermissionError(
      `You need one of these roles to call ${ctx.method}: ${requiredRoles.join(", ")}`,
    );
  }
  return next();
};

export interface ResolvedIdentity {
  user: MethodUser;
  session?: Session | null;
}

/**
 * Populate `ctx.user` / `ctx.session` using an app-supplied resolver (e.g.
 * session cookie -> Redis -> User doc + roles). Never rejects anonymous
 * calls; pair with `requireAuth` on the method for that.
 */
export function authenticate(
  resolve: (ctx: MethodContext) => Promise<ResolvedIdentity | null>,
): MethodMiddleware {
  return async (ctx, next) => {
    if (!ctx.user) {
      const identity = await resolve(ctx);
      if (identity) {
        ctx.user = identity.user;
        ctx.session = identity.session ?? null;
      }
    }
    return next();
  };
}

/** Per-method guard: reject anonymous callers. */
export const requireAuth: MethodMiddleware = (ctx, next) => {
  if (!ctx.user) throw new AuthenticationError("Authentication required");
  return next();
};

/** Per-method guard: caller must have at least one of `roles`. */
export function requireRoles(...roles: string[]): MethodMiddleware {
  return (ctx, next) => {
    if (!ctx.user) throw new AuthenticationError("Authentication required");
    if (!hasRequiredRole(ctx.user, roles)) {
      throw new PermissionError(`Requires one of: ${roles.join(", ")}`);
    }
    return next();
  };
}

/** Anything with a zod-style `parse()`; throws on invalid input. */
export interface ArgsSchema<T> {
  parse(input: unknown): T;
}

/**
 * Validate `ctx.args` against a schema (zod works as-is). On success
 * `ctx.args` is replaced with the parsed value; on failure a 400
 * `ValidationError` is thrown.
 */
export function validateArgs<T>(schema: ArgsSchema<T>): MethodMiddleware {
  return (ctx, next) => {
    try {
      ctx.args = schema.parse(ctx.args) as Record<string, unknown>;
    } catch (error) {
      const issues = (
        error as { issues?: Array<{ path?: unknown[]; message?: string }> }
      ).issues;
      throw new ValidationError("Invalid method arguments", {
        details: (issues ?? []).map((i) => ({
          field: (i.path ?? []).join("."),
          message: i.message ?? "Invalid value",
        })),
      });
    }
    return next();
  };
}

/** Minimal logger surface (satisfied by pino). */
export interface MethodLogger {
  info(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
}

/** Log each call with user, duration and outcome. */
export function logging(logger: MethodLogger): MethodMiddleware {
  return async (ctx, next) => {
    const base = () => ({
      method: ctx.method,
      user: ctx.user?.email ?? null,
      ms: Date.now() - ctx.startedAt,
    });
    try {
      const result = await next();
      logger.info({ ...base(), ok: true }, "method call");
      return result;
    } catch (error) {
      logger.error({ ...base(), ok: false, err: error }, "method call failed");
      throw error;
    }
  };
}

// ---------------------------------------------------------------------------
// Result / error formatting
// ---------------------------------------------------------------------------

/**
 * Format method result for JSON response
 * - Plain objects are returned as-is
 * - Arrays, primitives, null are wrapped in { result: ... }
 * - Undefined returns empty object
 */
export function formatResult(result: unknown): unknown {
  if (result === undefined) return {};
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    return { result };
  }
  return result;
}

/** HTTP status for a thrown error: NodraError subclasses carry their own, anything else is 500. */
export function methodErrorStatus(error: unknown): number {
  return error instanceof NodraError ? error.httpStatus : 500;
}
