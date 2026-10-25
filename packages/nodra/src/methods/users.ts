import type { MethodRegistry } from "../api/method";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { hashPassword, validatePasswordStrength } from "../auth/password";
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

  resource: {
    create(
      doctype: string,
      data: Record<string, unknown>,
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

function normalizeRoleNames(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((role) => typeof role === "string" && role.trim().length > 0)
  ) {
    throw new ValidationError("Roles must be an array of role names");
  }

  return [...new Set(value.map((role: string) => role.trim()))];
}

export function registerUserMethods(
  registry: MethodRegistry,
  getApp: () => Promise<UserMethodApp>,
): void {
  // List users
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

  // Get one user
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

      return {
        user: sanitizeUser(user.getData()),
      };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );

  // Create a user
  registry.register(
    "users.create",
    async (ctx) => {
      const email = String(ctx.args.email ?? "")
        .trim()
        .toLowerCase();

      const firstName = String(ctx.args.first_name ?? "").trim();
      const lastName = String(ctx.args.last_name ?? "").trim();
      const password = String(ctx.args.password ?? "");
      const userType = String(ctx.args.user_type ?? "System Manager");
      const enabled = ctx.args.enabled ?? true;

      if (!email || !firstName || !password) {
        throw new ValidationError(
          "Email, first name, and password are required",
        );
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ValidationError("Enter a valid email address");
      }

      if (!["System Manager", "Website User"].includes(userType)) {
        throw new ValidationError("Invalid user type");
      }

      if (typeof enabled !== "boolean") {
        throw new ValidationError("Enabled must be a boolean");
      }

      const passwordCheck = validatePasswordStrength(password);

      if (!passwordCheck.valid) {
        throw new ValidationError(passwordCheck.message ?? "Invalid password");
      }

      // The API accepts role names, not child-row objects.
      const assignedRoles = normalizeRoleNames(ctx.args.roles);

      const app = await getApp();
      assertUserDocType(app);

      if (!app.registry.has("Role")) {
        throw new ValidationError('DocType "Role" is not registered');
      }

      const availableRoles = await app.orm.getList("Role", {
        limit: 200,
      });

      const validRoleNames = new Set(
        availableRoles
          .map((role) => role.getData().name)
          .filter((name): name is string => typeof name === "string"),
      );

      for (const role of assignedRoles) {
        if (!validRoleNames.has(role)) {
          throw new ValidationError(`Unknown role: ${role}`);
        }
      }

      const passwordHash = await hashPassword(password);
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      const user = await app.resource.create("User", {
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        password: passwordHash,
        user_type: userType,
        enabled,
        roles: assignedRoles.map((role) => ({ role })),
      });

      return {
        user: sanitizeUser(user.getData()),
      };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );
}
