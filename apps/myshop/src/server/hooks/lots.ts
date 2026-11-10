import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";
import { moveStock } from "../methods/stock-ledger";

export const lotsHooks: WorkflowActionHooks = {
  "Lots.Confirm": async ({ orm, doc }) => {
    const lot = doc.name;

    const bags = Number(doc.get("bags") ?? 0);
    const netKgPerBag = Number(doc.get("net_kg_per_bag") ?? 0);
    const quantity = bags * netKgPerBag;

    const factory = String(doc.get("factory") ?? "");
    const warehouse = String(doc.get("warehouse") ?? "");

    // Determine the initial physical stock location.
    let destination;

    if (factory && !warehouse) {
      destination = {
        location_type: "Factory" as const,
        factory,
      };
    } else if (warehouse && !factory) {
      destination = {
        location_type: "Warehouse" as const,
        warehouse,
      };
    } else {
      throw new Error(
        `Lot ${lot} must have exactly one initial stock location: Factory or Warehouse.`,
      );
    }

    await moveStock(orm, {
      lot,
      movement_type: "Lot Receipt",
      bags,
      quantity,
      destination,
      voucher_type: "Lots",
      voucher_no: lot,
      posting_date: String(
        doc.get("arrival_date") || doc.get("entry_date") || "",
      ),
      remarks: "Initial stock created when lot was confirmed.",
    });
  },
};
