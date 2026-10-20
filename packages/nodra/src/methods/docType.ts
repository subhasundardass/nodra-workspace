import type { MethodRegistry } from "nodra/api/method";
import type { DocTypeDefinition } from "nodra/core/doctype/schema";
import { ValidationError } from "../core/errors";

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

      return { doctype };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
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

      if (!doctype) {
        throw new ValidationError(`DocType "${name}" not found`);
      }

      return {
        fields: doctype.fields,
      };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );
}
