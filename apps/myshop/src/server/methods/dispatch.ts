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

      // Pagination
      const requestedLimit = Number(ctx.args.limit);
      const requestedOffset = Number(ctx.args.offset);

      const limit = Number.isFinite(requestedLimit)
        ? Math.min(100, Math.max(1, Math.trunc(requestedLimit)))
        : 100;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      // Fetch required documents
      const [saleBooks, dispatches, parties, brokers, transporters, lots] =
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

          app.orm.getList("Lots", {
            limit: 1000,
            offset: 0,
          }),
        ]);

      // --------------------------------------------------
      // Identify SaleBooks already dispatched
      // --------------------------------------------------

      const dispatchedSaleBooks = new Set<string>();

      for (const dispatch of dispatches) {
        const data = serialise(dispatch) as DocumentData;
        const saleBookName = String(data.sale_book ?? "");

        if (saleBookName) {
          dispatchedSaleBooks.add(saleBookName);
        }
      }

      // --------------------------------------------------
      // Create lookup maps
      // --------------------------------------------------

      const partyMap = getTitleMap(parties);
      const brokerMap = getTitleMap(brokers);
      const transporterMap = getTitleMap(transporters);

      // Lot lookup by document name
      const lotMap = new Map<string, DocumentData>();

      for (const lot of lots) {
        const data = serialise(lot) as DocumentData;
        const lotName = String(data.name ?? "");

        if (lotName) {
          lotMap.set(lotName, data);
        }
      }

      // --------------------------------------------------
      // Filter pending SaleBooks
      // --------------------------------------------------

      const pendingSaleBooks = saleBooks
        .map((saleBook) => serialise(saleBook) as DocumentData)
        .filter((saleBook) => {
          const name = String(saleBook.name ?? "");

          return name && !dispatchedSaleBooks.has(name);
        });

      const totalCount = pendingSaleBooks.length;

      // Pagination
      const paginatedSaleBooks = pendingSaleBooks.slice(offset, offset + limit);

      // --------------------------------------------------
      // Prepare response
      // --------------------------------------------------

      const documents = paginatedSaleBooks.map((data) => {
        const name = String(data.name ?? "");

        // Linked Lot
        const lotName = String(data.lot ?? "");
        const lot = lotMap.get(lotName);

        // Linked master data
        const party = String(data.party ?? "");
        const broker = String(data.broker ?? "");
        const transporter = String(data.transporter ?? "");

        // Quantities
        const bags = Math.trunc(toNumber(data.bags));
        const totalKgs = toNumber(data.total_kgs);

        return {
          ...data,

          name,

          // Lot information
          lot: lotName || null,
          lot_no: lot?.lot_no ?? null,

          // Party information
          party: party || null,
          party_name: party ? (partyMap.get(party) ?? party) : null,

          // Broker information
          broker: broker || null,
          broker_name: broker ? (brokerMap.get(broker) ?? broker) : null,

          // Transporter information
          transporter: transporter || null,
          transporter_name: transporter
            ? (transporterMap.get(transporter) ?? transporter)
            : null,

          // Quantity information
          bags,
          total_bags: bags,
          total_kgs: totalKgs,
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

      // Pagination
      const requestedLimit = Number(ctx.args.limit);
      const requestedOffset = Number(ctx.args.offset);

      const limit = Number.isFinite(requestedLimit)
        ? Math.min(100, Math.max(1, Math.trunc(requestedLimit)))
        : 100;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      // Fetch required documents
      const [saleBooks, dispatches, parties, brokers, transporters, lots] =
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

          app.orm.getList("Lots", {
            limit: 1000,
            offset: 0,
          }),
        ]);

      // --------------------------------------------------
      // Build lookup maps
      // --------------------------------------------------

      // Dispatch by SaleBook
      const dispatchMap = new Map<string, DocumentData>();

      for (const dispatch of dispatches) {
        const data = serialise(dispatch) as DocumentData;
        const saleBookName = String(data.sale_book ?? "");

        if (saleBookName) {
          dispatchMap.set(saleBookName, data);
        }
      }

      // Lot by document name
      const lotMap = new Map<string, DocumentData>();

      for (const lot of lots) {
        const data = serialise(lot) as DocumentData;
        const lotName = String(data.name ?? "");

        if (lotName) {
          lotMap.set(lotName, data);
        }
      }

      // Master data maps
      const partyMap = getTitleMap(parties);
      const brokerMap = getTitleMap(brokers);
      const transporterMap = getTitleMap(transporters);

      // --------------------------------------------------
      // SaleBook records
      // --------------------------------------------------

      const allSaleBooks = saleBooks.map(
        (saleBook) => serialise(saleBook) as DocumentData,
      );

      const totalCount = allSaleBooks.length;

      // Pagination
      const paginatedSaleBooks = allSaleBooks.slice(offset, offset + limit);

      // --------------------------------------------------
      // Prepare response
      // --------------------------------------------------

      const documents = paginatedSaleBooks.map((data) => {
        const name = String(data.name ?? "");

        // Linked documents
        const dispatch = dispatchMap.get(name);

        const lotName = String(data.lot ?? "");
        const lot = lotMap.get(lotName);

        // Party and transporter
        const party = String(dispatch?.party ?? data.party ?? "");
        const transporter = String(dispatch?.transporter ?? "");

        // Broker
        const broker = String(data.broker ?? "");

        // Sale quantities
        const soldBags = Math.trunc(toNumber(data.sold_bags));
        const soldQuantity = toNumber(data.sold_quantity);
        const rate = toNumber(data.rate);

        return {
          ...data,

          name: dispatch?.name ?? null,
          sale_book: name,

          // Lot information
          lot: lotName || null,
          lot_no: lot?.lot_no ?? null,

          // Party information
          party: party || null,
          party_name: party ? (partyMap.get(party) ?? party) : null,

          // Broker information
          broker: broker || null,
          broker_name: broker ? (brokerMap.get(broker) ?? broker) : null,

          // Dispatch information
          dispatch: dispatch ?? null,
          dispatch_name: dispatch?.name ?? null,
          dispatch_date: dispatch?.dispatch_date ?? null,

          transporter: transporter || null,
          transporter_name: transporter
            ? (transporterMap.get(transporter) ?? transporter)
            : null,

          has_dispatch: Boolean(dispatch),

          // Sale information
          sold_bags: soldBags,
          sold_quantity: soldQuantity,
          rate,
          total_amount: soldQuantity * rate,
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
