import { createGetNodra } from "nodra/app";
import { loadConfig } from "nodra/core/config";

// Discover application DocType controllers.
const controllerModules = import.meta.glob<Record<string, unknown>>(
  "../../doctypes/*/*.ts",
  { eager: true },
);

// Discover application methods.
const methodModules = import.meta.glob<Record<string, unknown>>(
  "./methods/*.ts",
  { eager: true },
);

// Discover application workflow hooks.
const workflowHookModules = import.meta.glob<Record<string, unknown>>(
  "./hooks/*.ts",
  { eager: true },
);

// Config
const config = await loadConfig(process.cwd());

//--Nodra App
export const getNodra = createGetNodra({
  config,
  controllerModules,
  methodModules,
  workflowHookModules,
  sessionKeyPrefix: process.env.SESSION_PREFIX ?? "nodra",
});
