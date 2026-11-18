import type { MethodRegistry } from "nodra/api/method";

import { registerAuthMethods } from "./auth";
import { registerDocTypeMethods } from "./docType";
import { registerDocumentMethods } from "./document";
import { registerLinkMethods } from "./links";
import { registerRoleMethods } from "./roles";
import { registerUserMethods } from "./users";

export type FrameworkMethodOptions = {
  getApp: () => Promise<any>;
};

export function registerFrameworkMethods(
  registry: MethodRegistry,
  options: FrameworkMethodOptions,
): void {
  const { getApp } = options;

  // Public health check.
  registry.register(
    "ping",
    () => ({
      pong: true,
      time: new Date().toISOString(),
    }),
    { requireAuth: false },
  );

  // Register framework methods.
  registerAuthMethods(registry, getApp);
  registerDocTypeMethods(registry, getApp);
  registerDocumentMethods(registry, getApp);
  registerLinkMethods(registry, getApp);
  registerRoleMethods(registry, getApp);
  registerUserMethods(registry, getApp);

  // List registered methods (System Manager only).
  registry.register(
    "nodra.methods",
    async () => {
      const app = await getApp();

      const methods = app.methods.list().flatMap((path: string) => {
        const definition = app.methods.get(path);

        if (!definition) return [];

        return [
          {
            path,
            requireAuth: definition.requireAuth,
            requiredRoles: definition.requiredRoles,
            middlewareCount: definition.middleware.length,
          },
        ];
      });

      return {
        methods,
        total: methods.length,
      };
    },
    {
      requireAuth: true,
      requiredRoles: ["System Manager"],
    },
  );
}
