import type { WorkflowActionHooks } from "nodra/orm/workflow-hooks.js";
import { StockService, type StockLocation } from "../services/stock.service";

const EPSILON = 0.000001;

export const dispatchHooks: WorkflowActionHooks = {
  "Dispatch.Confirm": async ({ orm, doc }) => {
    const dispatch = String(doc.name ?? "").trim();

    if (!dispatch) {
      throw new Error("Dispatch ID is required.");
    }

    // 1. Validate SaleBook
    const saleBookName = String(doc.get("sale_book") ?? "").trim();

    if (!saleBookName) {
      throw new Error("Sale Book is required for dispatch.");
    }

    const saleBook = await orm.getDoc("SaleBook", saleBookName);

    if (!saleBook) {
      throw new Error(`Sale Book ${saleBookName} not found.`);
    }

    if (Number(saleBook.get("docstatus")) !== 51) {
      throw new Error("Only confirmed Sale Books can be dispatched.");
    }

    // 2. Identify Lot
    const lot = String(saleBook.get("lot") ?? "").trim();

    if (!lot) {
      throw new Error(`No Lot is linked to Sale Book ${saleBookName}.`);
    }

    // 3. Validate dispatch quantities
    const bags = Number(doc.get("total_bags"));
    const quantity = Number(doc.get("total_kgs"));

    if (
      !Number.isSafeInteger(bags) ||
      bags <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        "Dispatch bags and quantity must be valid positive values.",
      );
    }

    // 4. Validate dispatch date
    const postingDate = String(doc.get("dispatch_date") ?? "").trim();

    if (!postingDate) {
      throw new Error("Dispatch date is required.");
    }

    // 5. Read current stock balance
    const stockService = new StockService(orm);
    const stock = await stockService.getLotStockBalance(lot);

    // 6. Identify locations capable of fulfilling the dispatch
    const eligibleSources = stock.locations.filter(
      (location) =>
        location.bags >= bags && location.quantity + EPSILON >= quantity,
    );

    if (eligibleSources.length === 0) {
      throw new Error(
        `Insufficient stock for Lot ${lot}. ` +
          `Required: ${bags} bags / ${quantity} KG. ` +
          `Factory: ${stock.factory_bags} bags / ${stock.factory_quantity} KG. ` +
          `Warehouse: ${stock.warehouse_bags} bags / ${stock.warehouse_quantity} KG.`,
      );
    }

    if (eligibleSources.length > 1) {
      throw new Error(
        "Stock is available in multiple locations. " +
          "Please select the dispatch source explicitly.",
      );
    }

    const source = eligibleSources[0]?.location;

    if (!source) {
      throw new Error("Unable to determine dispatch stock source.");
    }

    // 7. Create outgoing StockLedger movement
    await stockService.moveStock({
      lot,
      movement_type: "Dispatch",
      bags,
      quantity,
      source,
      voucher_type: "Dispatch",
      voucher_no: dispatch,
      voucher_detail_no: saleBookName,
      posting_date: postingDate,
      remarks: `Stock dispatched against Sale ${saleBookName}.`,
    });
  },
};
