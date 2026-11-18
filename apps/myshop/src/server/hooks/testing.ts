import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";

export const testingHooks: WorkflowActionHooks = {
  "TeaTesting.Start Testing": async ({ orm, doc }) => {
    const lotName = doc.get("lot");

    if (typeof lotName !== "string" || !lotName) {
      throw new Error("A Lot must be selected before testing can start.");
    }

    const lot = await orm.getDoc("Lots", lotName);

    if (lot.get("workflow_state") !== "Confirmed") {
      throw new Error("Testing can only start for a confirmed Lot.");
    }
  },

  "TeaTesting.Complete Testing": async ({ orm, doc }) => {
    const lotName = doc.get("lot");

    if (typeof lotName !== "string" || !lotName) {
      throw new Error(
        "A Lot must be selected before testing can be completed.",
      );
    }

    const lot = await orm.getDoc("Lots", lotName);

    if (lot.get("workflow_state") !== "Confirmed") {
      throw new Error(
        "Testing cannot be completed because the linked Lot is not Confirmed.",
      );
    }

    if (!doc.get("sample_date")) {
      throw new Error("Testing Date is required.");
    }

    if (!doc.get("tested_grade")) {
      throw new Error("Tested Grade is required before completing testing.");
    }
  },
};
