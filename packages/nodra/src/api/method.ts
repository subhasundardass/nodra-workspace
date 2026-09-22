/**
 * Method Registry - Whitelisted API Method definitions.
 *
 * The Fastify `methodRoutes(app, registry)` plugin function that used to
 * live in this file was removed — HTTP wiring is now the consuming app's
 * responsibility (see apps/mfi/src/routes/api/method/$methodPath.ts for the
 * TanStack Start route that dispatches through this registry). Everything
 * below is transport-agnostic and can be reused by any HTTP layer.
 */
import type { UserContext } from '../permissions/permission.js';

/** A single whitelisted, callable server-side method. */
export interface MethodDefinition {
  /** The handler function */
  handler: (...args: unknown[]) => unknown;
  /** Whether authentication is required */
  requireAuth: boolean;
  /** Required roles to access this method */
  requiredRoles: string[];
}

/** Method registry interface */
export interface MethodRegistry {
  /** Register a method */
  register(
    path: string,
    handler: (...args: unknown[]) => unknown,
    options?: { requireAuth?: boolean; requiredRoles?: string[] },
  ): void;
  /** Get method definition */
  get(path: string): MethodDefinition | undefined;
  /** Check if method exists */
  has(path: string): boolean;
}

/** Default implementation of MethodRegistry */
export class DefaultMethodRegistry implements MethodRegistry {
  private methods = new Map<string, MethodDefinition>();

  register(
    path: string,
    handler: (...args: unknown[]) => unknown,
    options: { requireAuth?: boolean; requiredRoles?: string[] } = {},
  ): void {
    this.methods.set(path, {
      handler,
      requireAuth: options.requireAuth ?? false,
      requiredRoles: options.requiredRoles ?? [],
    });
  }

  get(path: string): MethodDefinition | undefined {
    return this.methods.get(path);
  }

  has(path: string): boolean {
    return this.methods.has(path);
  }

  /** Clear all registered methods (useful for testing) */
  clear(): void {
    this.methods.clear();
  }
}

/** Check if user has any of the required roles. */
export function hasRequiredRole(user: UserContext, requiredRoles: string[]): boolean {
  if (requiredRoles.length === 0) {
    return true;
  }
  return requiredRoles.some((role) => user.roles.includes(role));
}

/**
 * Format method result for JSON response
 * - Plain objects are returned as-is
 * - Arrays, primitives, null are wrapped in { result: ... }
 * - Undefined returns empty object
 */
export function formatResult(result: unknown): unknown {
  if (result === undefined) {
    return {};
  }

  if (result === null || typeof result !== 'object' || Array.isArray(result)) {
    return { result };
  }

  return result;
}
