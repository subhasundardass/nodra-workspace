import type { MethodRegistry } from "../api/method";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { ValidationError } from "../core/errors";

export interface RoleMethodApp {
  registry: {
    get(name: string): DocTypeDefinition;
    has(name: string): boolean;
  };
  orm: {
    getList(
      doctype: string,
      options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
      },
    ): Promise<Array<{ getData(): Record<string, unknown> }>>;
  };
}

export function registerRoleMethods(
  registry: MethodRegistry,
  getApp: () => Promise<RoleMethodApp>,
): void {
  registry.register(
    "roles.list",
    async (ctx) => {
      const app = await getApp();

      const requestedLimit = Number(ctx.args.limit ?? 100);
      const requestedOffset = Number(ctx.args.offset ?? 0);

      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(200, Math.trunc(requestedLimit)))
        : 100;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      // Fail clearly if the framework Role DocType is not installed.
      if (!app.registry.has("Role")) {
        throw new ValidationError('DocType "Role" is not registered');
      }

      const roles = await app.orm.getList("Role", {
        limit,
        offset,
        orderBy: "name asc",
      });

      return {
        roles: roles.map((role) => role.getData()),
        limit,
        offset,
      };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );
}
