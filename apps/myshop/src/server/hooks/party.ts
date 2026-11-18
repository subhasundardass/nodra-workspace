import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";

export const partyHooks: WorkflowActionHooks = {
  // "Party.Activate": async ({ doc }) => {
  //   const partyName = doc.get("title");
  //   if (typeof partyName !== "string" || !partyName.trim()) {
  //     throw new Error("Party Name is required before activation.");
  //   }
  //   const partyType = doc.get("party_type");
  //   if (partyType !== "Company" && partyType !== "Individual") {
  //     throw new Error("Select a valid Party Type before activation.");
  //   }
  //   doc.set("is_active", true);
  // },
};
