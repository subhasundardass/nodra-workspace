/**
 * Nodra methods for the "SaleBook" doctype.
 *
 * Supports multiple SaleBook entries against the same Lot.
 */

import type { MethodRegistry } from "nodra";
import type { Filters, ListOptions } from "nodra/orm/crud";
import { StockService } from "../services/stock.service";
import { getNodra } from "../nodra-app";
import { serialise } from "../http";

type DocumentData = Record<string, unknown>;

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toDateValue(value: unknown): number {
  if (!value) return 0;

  const timestamp = new Date(String(value)).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isCancelled(data: DocumentData): boolean {
  return Number(data.docstatus) === 98 || data.workflow_state === "Cancelled";
}

function getSortOrder(value: unknown): "asc" | "desc" {
  return String(value ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
}

function getLimit(value: unknown, defaultValue = 100, max = 1000): number {
  const requested = Number(value);

  return Number.isFinite(requested)
    ? Math.min(max, Math.max(1, Math.trunc(requested)))
    : defaultValue;
}

function getOffset(value: unknown): number {
  const requested = Number(value);

  return Number.isFinite(requested) ? Math.max(0, Math.trunc(requested)) : 0;
}

function getLatestFirst(a: DocumentData, b: DocumentData): number {
  const dateDifference = toDateValue(b.sale_date) - toDateValue(a.sale_date);

  if (dateDifference !== 0) return dateDifference;

  return String(b.name ?? "").localeCompare(String(a.name ?? ""));
}

function getLatestTestingFirst(a: DocumentData, b: DocumentData): number {
  return toDateValue(b.sample_date) - toDateValue(a.sample_date);
}

export function registerSaleBookMethods(registry: MethodRegistry): void {
  /**
   * SaleBook list.
   *
   * Displays one row per confirmed Lot.
   * Multiple SaleBook entries are grouped by Lot.
   */
  registry.register(
    "salebook.get_list",
    async (ctx) => {
      const app = await getNodra();

      const limit = getLimit(ctx.args.limit, 100, 100);
      const offset = getOffset(ctx.args.offset);
      const sortOrder = getSortOrder(ctx.args.sort_order);

      const lotFilters: Filters = {
        docstatus: 51,
      };

      const lotOptions: ListOptions = {
        limit,
        offset,
        orderBy: `lot_no ${sortOrder}`,
      };

      const [lots, totalCount, saleEntries, offerSheets, brokers, teaTestings] =
        await Promise.all([
          app.orm.getList("Lots", {
            ...lotOptions,
            filters: lotFilters,
          }),

          app.orm.getCount("Lots", lotFilters),

          app.orm.getList("SaleBook", {
            limit: 1000,
            offset: 0,
            filters: {
              docstatus: ["in", [0, 51]],
            },
          }),

          app.orm.getList("OfferSheet", {
            limit: 1000,
            offset: 0,
            filters: {
              docstatus: 51,
            },
          }),

          app.orm.getList("Broker", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("TeaTesting", {
            limit: 1000,
            offset: 0,
            filters: {
              docstatus: 51,
            },
          }),
        ]);

      // Group active SaleBook entries by Lot.
      const salesByLot = new Map<string, DocumentData[]>();

      for (const sale of saleEntries) {
        const data = serialise(sale) as DocumentData;

        if (isCancelled(data)) continue;

        const lotName = String(data.lot ?? "");
        if (!lotName) continue;

        const entries = salesByLot.get(lotName) ?? [];
        entries.push(data);

        salesByLot.set(lotName, entries);
      }

      // Sort SaleBook entries newest first.
      for (const entries of salesByLot.values()) {
        entries.sort(getLatestFirst);
      }

      // Broker ID to title.
      const brokerMap = new Map<string, string>();

      for (const broker of brokers) {
        const data = serialise(broker) as DocumentData;
        const brokerId = String(data.name ?? "");

        if (brokerId) {
          brokerMap.set(brokerId, String(data.title || brokerId));
        }
      }

      // Asking price from confirmed OfferLots.
      const askingPriceByLot = new Map<string, number>();

      for (const offer of offerSheets) {
        const offerData = serialise(offer) as DocumentData;

        const offerLots = Array.isArray(offerData.offer_lots)
          ? offerData.offer_lots
          : [];

        for (const row of offerLots) {
          const offerLot = row as DocumentData;
          const lotName = String(offerLot.lot ?? "");

          if (lotName) {
            askingPriceByLot.set(lotName, toNumber(offerLot.asking_rate));
          }
        }
      }

      // Latest completed TeaTesting entry by Lot.
      const testingByLot = new Map<string, DocumentData>();

      for (const testing of teaTestings) {
        const data = serialise(testing) as DocumentData;
        const lotName = String(data.lot ?? "");

        if (!lotName) continue;

        const existing = testingByLot.get(lotName);

        if (!existing || getLatestTestingFirst(data, existing) < 0) {
          testingByLot.set(lotName, data);
        }
      }

      // Merge Lot, SaleBook and related information.
      const documents = lots.map((lot) => {
        const data = serialise(lot) as DocumentData;
        const lotName = String(data.name ?? "");

        const testing = testingByLot.get(lotName) ?? null;
        const sales = salesByLot.get(lotName) ?? [];
        const latestSale = sales[0] ?? null;

        const totalSoldBags = sales.reduce(
          (total, sale) => total + toNumber(sale.sold_bags),
          0,
        );

        const totalSoldKg = sales.reduce(
          (total, sale) => total + toNumber(sale.sold_quantity),
          0,
        );

        const bags = toNumber(data.bags);
        const netKgPerBag = toNumber(data.net_kg_per_bag);

        return {
          name: lotName,
          lot: lotName,
          lot_no: String(data.lot_no ?? ""),

          // Tea Testing.
          tea_testing: testing?.name ?? null,
          tested_grade: testing?.tested_grade ?? null,
          test_information: testing
            ? [
                testing.appearance,
                testing.infusion,
                testing.liquor,
                testing.taste,
                testing.defects,
                testing.test_remarks,
              ]
                .filter(Boolean)
                .join(" / ")
            : null,

          tf: latestSale?.tf ?? null,

          // Latest SaleBook identity.
          sale_book_name: latestSale?.name ? String(latestSale.name) : null,

          sale_book_count: sales.length,

          // All active SaleBook entries.
          sale_book_entries: sales.map((sale) => ({
            name: sale.name,
            sale_date: sale.sale_date,
            sale_type: sale.sale_type,
            sold_bags: toNumber(sale.sold_bags),
            sold_quantity: toNumber(sale.sold_quantity),
            rate: toNumber(sale.rate),
            broker: sale.broker,
            workflow_state: sale.workflow_state,
          })),

          factory: data.factory ?? null,

          original_brand: data.original_brand ?? null,
          brand: latestSale?.brand ?? data.original_brand ?? null,

          original_grade: data.grade ?? null,
          grade: latestSale?.grade ?? data.grade ?? null,

          bags: Math.trunc(bags),
          net_kg_per_bag: netKgPerBag,
          total_kg: bags * netKgPerBag,

          arrival_date: data.arrival_date || null,

          offer: latestSale?.offer ?? null,
          asking_price: askingPriceByLot.get(lotName) ?? 0,

          sale_type: latestSale?.sale_type ?? null,
          rate: toNumber(latestSale?.rate),

          sold_bags: totalSoldBags,
          sold_quantity: totalSoldKg,

          broker: latestSale?.broker ?? null,
          broker_name: brokerMap.get(String(latestSale?.broker ?? "")) ?? "",

          sale_date: latestSale?.sale_date ?? null,
          remarks: latestSale?.remarks ?? "",
          workflow_state: latestSale?.workflow_state ?? null,
        };
      });

      return {
        documents,
        limit,
        offset,
        total_count: totalCount,
      };
    },
    { requireAuth: true },
  );

  /**
   * Get all active SaleBook entries for a Lot.
   *
   * Multiple entries are allowed.
   */
  registry.register(
    "salebook.get_by_lot",
    async (ctx) => {
      const app = await getNodra();

      const lotName = String(ctx.args.lot ?? "");

      if (!lotName) {
        throw new Error("Lot is required.");
      }

      const entries = await app.orm.getList("SaleBook", {
        limit: 1000,
        offset: 0,
        filters: {
          lot: lotName,
        },
      });

      const documents = entries
        .map((entry) => serialise(entry) as DocumentData)
        .filter((entry) => !isCancelled(entry))
        .sort(getLatestFirst);

      return {
        documents,
        total_count: documents.length,
      };
    },
    { requireAuth: true },
  );

  /**
   * Pending SaleBook entries for confirmed Lots.
   *
   * Displays one row per confirmed Lot.
   */
  registry.register(
    "salebook.get_pending_lots",
    async (ctx) => {
      const app = await getNodra();

      const limit = getLimit(ctx.args.limit, 100, 100);
      const offset = getOffset(ctx.args.offset);
      const sortOrder = getSortOrder(ctx.args.sort_order);

      const lotFilters: Filters = {
        docstatus: 51,
      };

      const lotOptions: ListOptions = {
        limit,
        offset,
        orderBy: `lot_no ${sortOrder}`,
      };

      const [lots, totalCount, teaTestings] = await Promise.all([
        app.orm.getList("Lots", {
          ...lotOptions,
          filters: lotFilters,
        }),

        app.orm.getCount("Lots", lotFilters),

        app.orm.getList("TeaTesting", {
          limit: 1000,
          offset: 0,
          filters: {
            docstatus: 51,
          },
        }),
      ]);

      // Latest completed TeaTesting entry by Lot.
      const testingByLot = new Map<string, DocumentData>();

      for (const testing of teaTestings) {
        const data = serialise(testing) as DocumentData;
        const lotName = String(data.lot ?? "");

        if (!lotName) continue;

        const existing = testingByLot.get(lotName);

        if (!existing || getLatestTestingFirst(data, existing) < 0) {
          testingByLot.set(lotName, data);
        }
      }

      const documents = lots.map((lot) => {
        const data = serialise(lot) as DocumentData;
        const lotName = String(data.name ?? "");
        const testing = testingByLot.get(lotName) ?? null;

        const bags = toNumber(data.bags);
        const netKgPerBag = toNumber(data.net_kg_per_bag);

        return {
          name: lotName,
          lot: lotName,
          lot_no: String(data.lot_no ?? ""),
          factory: data.factory ?? null,

          original_brand: data.original_brand ?? null,
          brand: data.brand ?? data.original_brand ?? null,

          original_grade: data.grade ?? null,
          grade: data.grade ?? null,

          bags,
          net_kg_per_bag: netKgPerBag,
          total_kg: bags * netKgPerBag,

          arrival_date: data.arrival_date || null,

          // Tea Testing.
          tea_testing: testing?.name ?? null,
          tested_grade: testing?.tested_grade ?? null,
          test_information: testing
            ? [
                testing.appearance,
                testing.infusion,
                testing.liquor,
                testing.taste,
                testing.defects,
                testing.test_remarks,
              ]
                .filter(Boolean)
                .join(" / ")
            : null,
        };
      });

      return {
        documents,
        limit,
        offset,
        total_count: totalCount,
      };
    },
    { requireAuth: true },
  );

  /**
   * Search available Lots for SaleBook.
   *
   * Only returns confirmed Lots with Factory stock
   * and without Warehouse stock.
   */
  registry.register(
    "salebook.search_available_lots",
    async (ctx) => {
      const app = await getNodra();

      const query = String(ctx.args.query ?? "")
        .trim()
        .toLowerCase();

      const selectedName = String(ctx.args.selectedName ?? "").trim();

      const titleField = String(ctx.args.titleField ?? "lot_no");

      const limit = getLimit(ctx.args.limit, 20, 100);

      const lots = await app.orm.getList("Lots", {
        limit: 1000,
        offset: 0,
        filters: {
          docstatus: 51,
        },
      });

      const candidates = lots
        .map((lot) => serialise(lot) as DocumentData)
        .filter((lot) => {
          const name = String(lot.name ?? "");

          if (selectedName) {
            return name === selectedName;
          }

          if (!query) return true;

          const title = String(lot[titleField] ?? "");

          return (
            name.toLowerCase().includes(query) ||
            title.toLowerCase().includes(query)
          );
        });

      const stockService = new StockService(app.orm);

      const items: Array<{ name: string; label: string }> = [];
      const batchSize = 20;

      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);

        const results = await Promise.all(
          batch.map(async (lot) => {
            try {
              const lotName = String(lot.name ?? "");

              if (!lotName) return null;

              const stock = await stockService.getLotStockBalance(lotName);

              // Require available Factory stock.
              if (
                toNumber(stock.factory_bags) <= 0 ||
                toNumber(stock.factory_quantity) <= 0
              ) {
                return null;
              }

              // Exclude Lots with Warehouse stock.
              if (
                toNumber(stock.warehouse_bags) !== 0 ||
                toNumber(stock.warehouse_quantity) > 0.000001
              ) {
                return null;
              }

              return {
                name: lotName,
                label: String(lot[titleField] || lotName),
              };
            } catch {
              // Exclude Lots when stock cannot be verified.
              return null;
            }
          }),
        );

        for (const item of results) {
          if (item) items.push(item);
        }

        if (!selectedName && items.length >= limit) {
          break;
        }
      }

      return {
        items: selectedName ? items : items.slice(0, limit),
      };
    },
    { requireAuth: true },
  );

  /**
   * Sale Report.
   *
   * Displays one row per confirmed SaleBook entry.
   * Includes Lot and Broker information.
   */
  registry.register(
    "sale.report.index",
    async (ctx) => {
      const app = await getNodra();

      const limit = getLimit(ctx.args.limit, 100, 1000);
      const offset = getOffset(ctx.args.offset);
      const sortOrder = getSortOrder(ctx.args.sort_order);

      const filters: Filters = {
        docstatus: 51,
      };

      const options: ListOptions = {
        limit,
        offset,
        orderBy: `sale_date ${sortOrder}`,
      };

      const [saleEntries, totalCount, lots, brokers] = await Promise.all([
        app.orm.getList("SaleBook", {
          ...options,
          filters,
        }),

        app.orm.getCount("SaleBook", filters),

        app.orm.getList("Lots", {
          limit: 1000,
          offset: 0,
        }),

        app.orm.getList("Broker", {
          limit: 1000,
          offset: 0,
        }),
      ]);

      // Lot ID to Lot document.
      const lotMap = new Map<string, DocumentData>();

      for (const lot of lots) {
        const data = serialise(lot) as DocumentData;
        const name = String(data.name ?? "");

        if (name) {
          lotMap.set(name, data);
        }
      }

      // Broker ID to Broker title.
      const brokerMap = new Map<string, string>();

      for (const broker of brokers) {
        const data = serialise(broker) as DocumentData;
        const name = String(data.name ?? "");

        if (name) {
          brokerMap.set(name, String(data.broker_name || data.title || name));
        }
      }

      // One row per confirmed SaleBook entry.
      const documents = saleEntries.map((entry) => {
        const sale = serialise(entry) as DocumentData;

        const lotName = String(sale.lot ?? "");
        const lot = lotMap.get(lotName) ?? {};

        const broker = String(sale.broker ?? "");

        const soldBags = toNumber(sale.sold_bags);
        const soldQuantity = toNumber(sale.sold_quantity);
        const rate = toNumber(sale.rate);

        const netKgPerBag = toNumber(lot.net_kg_per_bag);

        return {
          // SaleBook identity.
          name: String(sale.name ?? ""),
          sale_book_name: String(sale.name ?? ""),

          // Lot information.
          lot: lotName,
          lot_no: String(lot.lot_no ?? ""),
          factory: lot.factory ?? null,
          original_brand: lot.original_brand ?? null,
          grade: sale.grade ?? lot.grade ?? null,
          arrival_date: lot.arrival_date ?? null,
          net_kg_per_bag: netKgPerBag,
          total_kg: toNumber(lot.bags) * netKgPerBag,

          // Sale information.
          sale_date: sale.sale_date ?? null,
          sale_type: sale.sale_type ?? null, // Bid / Advance
          sold_bags: soldBags,
          sold_quantity: soldQuantity,
          rate,
          total_amount: soldQuantity * rate,

          // Test Information
          app_inv_liq: sale.app_inv_liq ?? null, // APP / INV / LIQ
          tf: sale.tf ?? null, // T / F

          // Broker information.
          broker: broker || null,
          broker_name: brokerMap.get(broker) ?? "",

          remarks: sale.remarks ?? "",

          workflow_state: sale.workflow_state ?? "Confirmed",
        };
      });

      return {
        documents,
        total_count: totalCount,
        limit,
        offset,
      };
    },
    { requireAuth: true },
  );
}
