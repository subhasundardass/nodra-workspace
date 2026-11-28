import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";
import { StockService } from "../services/stock.service";

export const lotsHooks: WorkflowActionHooks = {
  "Lots.Confirm": async ({ orm, doc }) => {
    const lot = doc.name;

    const stockService = new StockService(orm);

    // Check whether initial stock was already created.
    const existingReceipt = await orm.getList("StockLedger", {
      filters: {
        voucher_type: "Lots",
        voucher_no: lot,
        voucher_detail_no: "",
        movement_type: "Lot Receipt",
      },
      limit: 1,
    });

    // Already received: don't create duplicate stock.
    if (existingReceipt.length > 0) {
      return;
    }

    const bags = Number(doc.get("bags") ?? 0);
    const netKgPerBag = Number(doc.get("net_kg_per_bag") ?? 0);
    const quantity = bags * netKgPerBag;

    const factory = String(doc.get("factory") ?? "").trim();
    const warehouse = String(doc.get("warehouse") ?? "").trim();

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

    await stockService.moveStock({
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
