import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";
import { moveStock } from "../methods/stock-ledger";

export const dispatchHooks: WorkflowActionHooks = {
  "Dispatch.Confirm": async ({ orm, doc }) => {
    const dispatch = doc.name;

    const saleBookName = String(doc.get("sale_book") ?? "");

    if (!saleBookName) {
      throw new Error("Sale Book is required for dispatch.");
    }

    // Get the related SaleBook to identify the lot.
    const saleBook = await orm.getDoc("SaleBook", saleBookName);

    if (!saleBook) {
      throw new Error(`Sale Book ${saleBookName} not found.`);
    }

    const lot = String(saleBook.get("lot") ?? "");

    if (!lot) {
      throw new Error(`No Lot is linked to Sale Book ${saleBookName}.`);
    }

    const bags = Number(doc.get("total_bags") ?? 0);
    const quantity = Number(doc.get("total_kgs") ?? 0);

    if (bags <= 0 || quantity <= 0) {
      throw new Error("Dispatch bags and quantity must be greater than zero.");
    }

    const locationType = String(doc.get("location_type") ?? "");
    const factory = String(doc.get("factory") ?? "");
    const warehouse = String(doc.get("warehouse") ?? "");

    let source;

    if (locationType === "Factory" && factory && !warehouse) {
      source = {
        location_type: "Factory" as const,
        factory,
      };
    } else if (locationType === "Warehouse" && warehouse && !factory) {
      source = {
        location_type: "Warehouse" as const,
        warehouse,
      };
    } else {
      throw new Error(
        "Select exactly one valid dispatch source: Factory or Warehouse.",
      );
    }

    await moveStock(orm, {
      lot,
      movement_type: "Dispatch",
      bags,
      quantity,
      source,
      voucher_type: "Dispatch",
      voucher_no: dispatch,
      voucher_detail_no: saleBookName,
      posting_date: String(doc.get("dispatch_date") ?? ""),
      remarks: `Stock dispatched against Sale  ${saleBookName}.`,
    });
  },
};
