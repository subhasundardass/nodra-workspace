import type { WorkflowActionHooks } from "./workflow-hooks.js";

export function discoverWorkflowHooks(
  modules: Record<string, Record<string, unknown>>,
): WorkflowActionHooks {
  const hooks: WorkflowActionHooks = {};

  for (const [file, module] of Object.entries(modules)) {
    for (const [exportName, value] of Object.entries(module)) {
      if (
        !/^[a-zA-Z]\w*Hooks$/.test(exportName) ||
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      ) {
        continue;
      }

      for (const [action, handler] of Object.entries(value)) {
        if (Object.hasOwn(hooks, action)) {
          throw new Error(
            `Duplicate workflow hook "${action}" found in ${file}`,
          );
        }

        if (typeof handler !== "function") {
          throw new Error(`Invalid workflow hook "${action}" found in ${file}`);
        }

        hooks[action] = handler as WorkflowActionHooks[string];
      }
    }
  }

  return hooks;
}
