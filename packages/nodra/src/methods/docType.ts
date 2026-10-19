import type { MethodRegistry } from "nodra/api/method";
import type { DocTypeDefinition } from "nodra/core/doctype/schema";

interface DocTypeMethodApp {
  registry: {
    list(): DocTypeDefinition[];
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
}
