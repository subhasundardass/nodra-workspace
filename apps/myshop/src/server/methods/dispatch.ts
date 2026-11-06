/**
 * Nodra methods for the "Dispatch" doctype.
 *
 * Returns SaleBook entries pending dispatch.
 * A SaleBook entry is excluded once a Dispatch record
 * has been created against it.
 */

import type { MethodRegistry } from "nodra";
import { getNodra } from "../nodra-app";
import { serialise } from "../http";

type DocumentData = Record<string, unknown>;

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function getTitleMap(documents: unknown[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const document of documents) {
    const data = serialise(document) as DocumentData;
    const name = String(data.name ?? "");

    if (name) {
      map.set(name, String(data.title || name));
    }
  }

  return map;
}

export function registerDispatchMethods(registry: MethodRegistry): void {
  registry.register(
    "dispatch.get_pending_list",
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

      const [saleBooks, dispatches, parties, brokers, transporters] =
        await Promise.all([
          app.orm.getList("SaleBook", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Dispatch", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Party", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Broker", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Transporter", {
            limit: 1000,
            offset: 0,
          }),
        ]);

      // Identify SaleBook entries that already have a Dispatch.
      const dispatchedSaleBooks = new Set<string>();

      for (const dispatch of dispatches) {
        const data = serialise(dispatch) as DocumentData;
        const saleBook = String(data.sale_book ?? "");

        if (saleBook) {
          dispatchedSaleBooks.add(saleBook);
        }
      }

      // Create lookup maps for linked documents.
      const partyMap = getTitleMap(parties);
      const brokerMap = getTitleMap(brokers);
      const transporterMap = getTitleMap(transporters);

      // Keep only SaleBook entries pending dispatch.
      const pendingSaleBooks = saleBooks
        .map((saleBook) => serialise(saleBook) as DocumentData)
        .filter((saleBook) => {
          const name = String(saleBook.name ?? "");

          return name && !dispatchedSaleBooks.has(name);
        });

      const totalCount = pendingSaleBooks.length;

      // Apply pagination after filtering.
      const paginatedSaleBooks = pendingSaleBooks.slice(offset, offset + limit);

      const documents = paginatedSaleBooks.map((data) => {
        const party = String(data.party ?? "");
        const broker = String(data.broker ?? "");
        const transporter = String(data.transporter ?? "");

        return {
          ...data,

          name: String(data.name ?? ""),

          party: party || null,
          party_name: (partyMap.get(party) ?? party) || null,

          broker: broker || null,
          broker_name: (brokerMap.get(broker) ?? broker) || null,

          transporter: transporter || null,
          transporter_name:
            (transporterMap.get(transporter) ?? transporter) || null,

          bags: Math.trunc(toNumber(data.bags)),
          total_bags: Math.trunc(toNumber(data.bags)),

          total_kgs: toNumber(data.total_kgs),
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

  //--All
  registry.register(
    "dispatch.get_list",
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

      const [saleBooks, dispatches, parties, brokers, transporters] =
        await Promise.all([
          app.orm.getList("SaleBook", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Dispatch", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Party", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Broker", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Transporter", {
            limit: 1000,
            offset: 0,
          }),
        ]);

      // Identify SaleBook entries that already have a Dispatch.
      const dispatchedSaleBooks = new Set<string>();

      for (const dispatch of dispatches) {
        const data = serialise(dispatch) as DocumentData;
        const saleBook = String(data.sale_book ?? "");

        if (saleBook) {
          dispatchedSaleBooks.add(saleBook);
        }
      }

      // Create lookup maps for linked documents.
      const partyMap = getTitleMap(parties);
      const brokerMap = getTitleMap(brokers);
      const transporterMap = getTitleMap(transporters);

      // Keep only SaleBook entries pending dispatch.
      const pendingSaleBooks = saleBooks
        .map((saleBook) => serialise(saleBook) as DocumentData)
        .filter((saleBook) => {
          const name = String(saleBook.name ?? "");

          return name && !dispatchedSaleBooks.has(name);
        });

      const totalCount = pendingSaleBooks.length;

      // Apply pagination after filtering.
      const paginatedSaleBooks = pendingSaleBooks.slice(offset, offset + limit);

      const documents = paginatedSaleBooks.map((data) => {
        const party = String(data.party ?? "");
        const broker = String(data.broker ?? "");
        const transporter = String(data.transporter ?? "");

        return {
          ...data,

          name: String(data.name ?? ""),

          party: party || null,
          party_name: (partyMap.get(party) ?? party) || null,

          broker: broker || null,
          broker_name: (brokerMap.get(broker) ?? broker) || null,

          transporter: transporter || null,
          transporter_name:
            (transporterMap.get(transporter) ?? transporter) || null,

          bags: Math.trunc(toNumber(data.bags)),
          total_bags: Math.trunc(toNumber(data.bags)),

          total_kgs: toNumber(data.total_kgs),
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

  // Find an existing Dispatch document using its linked SaleBook.
  registry.register(
    "dispatch.get_by_sale_book",
    async (ctx) => {
      const app = await getNodra();

      const saleBookName = String(ctx.args.sale_book ?? "");

      if (!saleBookName) {
        throw new Error("Sale Book is required.");
      }

      const entries = await app.orm.getList("Dispatch", {
        limit: 10,
        offset: 0,
        filters: {
          sale_book: saleBookName,
        },
      });

      const documents = entries
        .map((entry) => serialise(entry) as DocumentData)
        .filter((entry) => Number(entry.docstatus) !== 98);

      if (documents.length > 1) {
        throw new Error(
          `Multiple Dispatch entries exist for SaleBook "${saleBookName}". Please resolve the duplicates.`,
        );
      }

      return {
        document: documents[0] ?? null,
      };
    },
    { requireAuth: true },
  );
}
