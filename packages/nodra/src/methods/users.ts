import type { MethodRegistry } from "../api/method";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { ValidationError } from "../core/errors";

export interface UserMethodApp {
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
    getDoc(
      doctype: string,
      name: string,
    ): Promise<{ getData(): Record<string, unknown> }>;
  };
}

const USER_FIELDS = [
  "name",
  "email",
  "full_name",
  "enabled",
  "user_type",
] as const;

function sanitizeUser(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    USER_FIELDS.filter((field) => field in data).map((field) => [
      field,
      data[field],
    ]),
  );
}

function assertUserDocType(app: UserMethodApp): void {
  if (!app.registry.has("User")) {
    throw new ValidationError('DocType "User" is not registered');
  }
}

export function registerUserMethods(
  registry: MethodRegistry,
  getApp: () => Promise<UserMethodApp>,
): void {
  registry.register(
    "users.list",
    async (ctx) => {
      const app = await getApp();
      assertUserDocType(app);

      const requestedLimit = Number(ctx.args.limit ?? 50);
      const requestedOffset = Number(ctx.args.offset ?? 0);

      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(100, Math.trunc(requestedLimit)))
        : 50;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      const users = await app.orm.getList("User", {
        limit,
        offset,
        orderBy: "full_name asc",
      });

      return {
        users: users.map((user) => sanitizeUser(user.getData())),
        limit,
        offset,
      };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );

  registry.register(
    "users.get",
    async (ctx) => {
      const name = String(ctx.args.name ?? "").trim();

      if (!name) {
        throw new ValidationError('"name" is required');
      }

      const app = await getApp();
      assertUserDocType(app);

      const user = await app.orm.getDoc("User", name);

      return { user: sanitizeUser(user.getData()) };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );
}
