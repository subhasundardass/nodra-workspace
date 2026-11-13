import type { MethodRegistry } from "nodra";
import { getNodra } from "../nodra-app";
import {
  StockService,
  type StockMovement,
  type LocationType,
} from "../services/stock.service";

export function registerStockLedgerMethods(registry: MethodRegistry): void {
  registry.register(
    "stock.get_lot_balance",
    async (ctx) => {
      const app = await getNodra();
      const lot = String(ctx.args.lot ?? "").trim();

      if (!lot) {
        throw new Error("Lot is required.");
      }

      const stockService = new StockService(app.orm);

      return stockService.getLotStockBalance(lot);
    },
    { requireAuth: true },
  );

  registry.register(
    "stock.post_movement",
    async (ctx) => {
      const app = await getNodra();
      const movement = ctx.args.movement as StockMovement;

      const stockService = new StockService(app.orm);

      await stockService.moveStock(movement);

      return { success: true };
    },
    { requireAuth: true },
  );

  registry.register(
    "stock.get_location_balance",
    async (ctx) => {
      const app = await getNodra();

      const stockService = new StockService(app.orm);

      return stockService.getLocationBalances({
        fromDate: String(ctx.args.from_date ?? ""),
        toDate: String(ctx.args.to_date ?? ""),
        locationType: ctx.args.location_type
          ? (String(ctx.args.location_type) as LocationType)
          : undefined,
      });
    },
    { requireAuth: true },
  );
}
