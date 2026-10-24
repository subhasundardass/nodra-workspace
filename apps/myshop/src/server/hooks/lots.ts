import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";

export const lotsHooks: WorkflowActionHooks = {
  "Lots.Confirm": async ({ orm, doc, user }) => {
    // Create the related Testing document here.
  },
};
