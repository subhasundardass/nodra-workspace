/**
 * Nodra methods for the "SaleBook" doctype.
 *
 * Supports multiple SaleBook entries against the same Lot.
 */

import type { MethodRegistry } from "nodra";
import type { Filters, ListOptions } from "nodra/orm/crud";

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

      const requestedLimit = Number(ctx.args.limit);
      const requestedOffset = Number(ctx.args.offset);

      const limit = Number.isFinite(requestedLimit)
        ? Math.min(100, Math.max(1, Math.trunc(requestedLimit)))
        : 100;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      const sortOrder =
        String(ctx.args.sort_order ?? "desc").toLowerCase() === "asc"
          ? "asc"
          : "desc";

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

      // Group all active SaleBook entries by Lot.
      const salesByLot = new Map<string, DocumentData[]>();

      for (const sale of saleEntries) {
        const data = serialise(sale) as DocumentData;

        if (isCancelled(data)) continue;

        const lotName = String(data.lot ?? "");

        if (!lotName) continue;

        const existing = salesByLot.get(lotName) ?? [];

        existing.push(data);

        salesByLot.set(lotName, existing);
      }

      // Sort entries so the latest SaleBook entry is first.
      for (const entries of salesByLot.values()) {
        entries.sort((a, b) => {
          const dateDifference =
            toDateValue(b.sale_date) - toDateValue(a.sale_date);

          if (dateDifference !== 0) {
            return dateDifference;
          }

          return String(b.name ?? "").localeCompare(String(a.name ?? ""));
        });
      }

      // Map Broker IDs to Broker titles.
      const brokerMap = new Map<string, string>();

      for (const broker of brokers) {
        const data = serialise(broker) as DocumentData;
        const brokerId = String(data.name ?? "");

        if (brokerId) {
          brokerMap.set(brokerId, String(data.title || brokerId));
        }
      }

      // Map asking rates from confirmed OfferLots.
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

      // Tea Testing data is not currently used in the merged output, but it can be processed similarly if needed.
      const testingByLot = new Map<string, DocumentData>();
      for (const testing of teaTestings) {
        const data = serialise(testing) as DocumentData;
        const lotName = String(data.lot ?? "");

        if (!lotName) continue;

        const existing = testingByLot.get(lotName);

        if (
          !existing ||
          toDateValue(data.sample_date) > toDateValue(existing.sample_date)
        ) {
          testingByLot.set(lotName, data);
        }
      }

      // Merge Lot, SaleBook and Offer data.
      const documents = lots.map((lot) => {
        const data = serialise(lot) as DocumentData;
        const lotName = String(data.name ?? "");
        const testing = testingByLot.get(lotName) ?? null;
        const sales = salesByLot.get(lotName) ?? [];

        // Latest SaleBook entry for displaying individual fields.
        const latestSale = sales[0] ?? null;

        // Aggregate quantities across all active SaleBook entries.
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
          // Lot identity.
          name: lotName,
          lot: lotName,
          lot_no: String(data.lot_no ?? ""),

          // Testing information from the latest TeaTesting entry for this Lot.
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
          // Use individual SaleBook document name for updates.
          sale_book_name: latestSale?.name ? String(latestSale.name) : null,

          // All SaleBook records belonging to this Lot.
          sale_book_count: sales.length,
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

          // Aggregate sale quantities.
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
        .sort((a, b) => {
          const dateDifference =
            toDateValue(b.sale_date) - toDateValue(a.sale_date);

          if (dateDifference !== 0) {
            return dateDifference;
          }

          return String(b.name ?? "").localeCompare(String(a.name ?? ""));
        });

      return {
        documents,
        total_count: documents.length,
      };
    },
    { requireAuth: true },
  );

  /**
   * Pending SaleBook entries for Lots that are confirmed but not yet sold.
   *
   * Displays one row per confirmed Lot.
   * Multiple SaleBook entries are grouped by Lot.  
   */
  registry.register(
    "salebook.get_pending_lots",
    async (ctx) => {
      const app = await getNodra();

      const requestedLimit = Number(ctx.args.limit);
      const requestedOffset = Number(ctx.args.offset);

      const limit = Number.isFinite(requestedLimit)
        ? Math.min(100, Math.max(1, Math.trunc(requestedLimit)))
        : 100;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      const sortOrder =
        String(ctx.args.sort_order ?? "desc").toLowerCase() === "asc"
          ? "asc"
          : "desc";

      const lotFilters: Filters = {
        docstatus: 51,
      };

      const lotOptions: ListOptions = {
        limit,
        offset,
        orderBy: `lot_no ${sortOrder}`,
      };

      const [lots, totalCount] = await Promise.all([
        app.orm.getList("Lots", {
          ...lotOptions,
          filters: lotFilters,
        }),

        app.orm.getCount("Lots", lotFilters),
      ]);

      const documents = lots.map((lot) => {
        const data = serialise(lot) as DocumentData;
        const lotName = String(data.name ?? "");

        return {
          name: lotName,
          lot: lotName,
          lot_no: String(data.lot_no ?? ""),
          factory: data.factory ?? null,

          original_brand: data.original_brand ?? null,
          brand: data.brand ?? data.original_brand ?? null,

          original_grade: data.grade ?? null,
          grade: data.grade ?? null,

          bags: toNumber(data.bags),
          net_kg_per_bag: toNumber(data.net_kg_per_bag),
          total_kg: toNumber(data.bags) * toNumber(data.net_kg_per_bag),

          arrival_date: data.arrival_date || null,
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
}
