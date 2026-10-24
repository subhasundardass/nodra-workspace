import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";

export const testingHooks: WorkflowActionHooks = {
  "Testing.Confirm": async ({ orm, doc, user }) => {
    // Create the related Testing document here.
  },
};
