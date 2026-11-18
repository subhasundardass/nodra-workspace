import type { MethodRegistry } from "nodra/api/method";
import type { DocTypeDefinition } from "nodra/core/doctype/schema";
import { ValidationError } from "../core/errors";
import { hasPermission } from "../permissions/permission";
import { PermissionError } from "../core/errors";

interface DocTypeMethodApp {
  registry: {
    list(): DocTypeDefinition[];
    get(name: string): DocTypeDefinition;
  };
}

export function registerDocTypeMethods(
  registry: MethodRegistry,
  getApp: () => Promise<DocTypeMethodApp>,
): void {
  registry.register(
    "nodra.doctypes",
    async () => {
      const app = await getApp();

      return {
        doctypes: app.registry.list(),
      };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );

  //--Single Doctype
  registry.register(
    "nodra.doctype.get",
    async (ctx) => {
      const name = String(ctx.args.name ?? "").trim();

      if (!name) {
        throw new ValidationError('"name" is required');
      }

      const app = await getApp();
      const doctype = app.registry.get(name);

      if (!ctx.user || !hasPermission(doctype, "read", ctx.user)) {
        throw new PermissionError(`You do not have permission to read ${name}`);
      }

      return { doctype };
    },
    {
      requireAuth: true,
    },
  );

  //--Fields
  registry.register(
    "nodra.doctype.fields",
    async (ctx) => {
      const name = String(ctx.args.name ?? "").trim();

      if (!name) {
        throw new ValidationError('"name" is required');
      }

      const app = await getApp();
      const doctype = app.registry.get(name);

      if (!ctx.user || !hasPermission(doctype, "read", ctx.user)) {
        throw new PermissionError(`You do not have permission to read ${name}`);
      }

      return {
        fields: doctype.fields,
      };
    },
    {
      requireAuth: true,
    },
  );
}
