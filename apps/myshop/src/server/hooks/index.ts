import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";
import { lotsHooks } from "./lots.js";
import { testingHooks } from "./testing.js";

export const workflowHooks: WorkflowActionHooks = {
  ...lotsHooks,
  ...testingHooks,
};
