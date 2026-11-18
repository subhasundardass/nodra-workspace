/**
 * Nodra methods for the "Dispatch" doctype.
 *
 * Dispatch Book:
 *   - Uses SaleBook as the source of sale and lot information.
 *   - Uses Dispatch as the source of dispatch information and status.
 *
 * Status mapping:
 *   - No Dispatch / Draft (docstatus 0) = Pending
 *   - Confirmed (docstatus 51)         = Confirmed
 *   - Cancelled (docstatus 98)         = Cancelled
 */

import type { MethodRegistry } from "nodra";
import { getNodra } from "../nodra-app";
import { serialise } from "../http";

type DocumentData = Record<string, unknown>;

type DispatchStatus = "Pending" | "Confirmed" | "Cancelled";

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function getDocStatus(document: DocumentData): number {
  return Number(document.docstatus ?? 0);
}

function getDispatchStatus(
  dispatch: DocumentData,
): "Draft" | "Confirmed" | "Cancelled" {
  const docstatus = Number(dispatch.docstatus);

  if (docstatus === 51) return "Confirmed";
  if (docstatus === 98) return "Cancelled";

  return "Draft";
}

/**
 * Select the most relevant Dispatch for a SaleBook.
 *
 * A non-cancelled Dispatch always takes priority over
 * a cancelled Dispatch for the same SaleBook.
 */
function buildDispatchMap(dispatches: unknown[]): Map<string, DocumentData> {
  const map = new Map<string, DocumentData>();

  for (const document of dispatches) {
    const data = serialise(document) as DocumentData;
    const saleBookName = String(data.sale_book ?? "").trim();

    if (!saleBookName) continue;

    const existing = map.get(saleBookName);

    if (!existing) {
      map.set(saleBookName, data);
      continue;
    }

    const existingCancelled = getDocStatus(existing) === 98;
    const currentCancelled = getDocStatus(data) === 98;

    // Prefer an active Draft or Confirmed Dispatch
    // over an older Cancelled Dispatch.
    if (existingCancelled && !currentCancelled) {
      map.set(saleBookName, data);
    }
  }

  return map;
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

function buildLotMap(documents: unknown[]): Map<string, DocumentData> {
  const map = new Map<string, DocumentData>();

  for (const document of documents) {
    const data = serialise(document) as DocumentData;
    const name = String(data.name ?? "");

    if (name) {
      map.set(name, data);
    }
  }

  return map;
}

function getPagination(ctx: { args: Record<string, unknown> }): {
  limit: number;
  offset: number;
} {
  const requestedLimit = Number(ctx.args.limit);
  const requestedOffset = Number(ctx.args.offset);

  return {
    limit: Number.isFinite(requestedLimit)
      ? Math.min(100, Math.max(1, Math.trunc(requestedLimit)))
      : 100,

    offset: Number.isFinite(requestedOffset)
      ? Math.max(0, Math.trunc(requestedOffset))
      : 0,
  };
}

export function registerDispatchMethods(registry: MethodRegistry): void {
  // --------------------------------------------------
  // Pending Dispatch List
  //
  // Returns SaleBooks that do not have an active
  // Dispatch record.
  //
  // Draft and Confirmed Dispatches are considered
  // already created. Cancelled Dispatches do not
  // permanently block a SaleBook from being dispatched.
  // --------------------------------------------------

  registry.register(
    "dispatch.get_pending_list",
    async (ctx) => {
      const app = await getNodra();
      const { limit, offset } = getPagination(ctx);

      const [saleBooks, dispatches, parties, brokers, transporters, lots] =
        await Promise.all([
          app.orm.getList("SaleBook", { limit: 1000, offset: 0 }),
          app.orm.getList("Dispatch", { limit: 1000, offset: 0 }),
          app.orm.getList("Party", { limit: 1000, offset: 0 }),
          app.orm.getList("Broker", { limit: 1000, offset: 0 }),
          app.orm.getList("Transporter", { limit: 1000, offset: 0 }),
          app.orm.getList("Lots", { limit: 1000, offset: 0 }),
        ]);

      const dispatchMap = buildDispatchMap(dispatches);

      const partyMap = getTitleMap(parties);
      const brokerMap = getTitleMap(brokers);
      const transporterMap = getTitleMap(transporters);
      const lotMap = buildLotMap(lots);

      // Only active Dispatch records block a SaleBook.
      const pendingSaleBooks = saleBooks
        .map((document) => serialise(document) as DocumentData)
        .filter((saleBook) => {
          const name = String(saleBook.name ?? "");
          if (!name) return false;

          const dispatch = dispatchMap.get(name);

          return !dispatch || getDocStatus(dispatch) === 98;
        });

      const totalCount = pendingSaleBooks.length;
      const paginatedSaleBooks = pendingSaleBooks.slice(offset, offset + limit);

      const documents = paginatedSaleBooks.map((data) => {
        const name = String(data.name ?? "");

        const lotName = String(data.lot ?? "");
        const lot = lotMap.get(lotName);

        const party = String(data.party ?? "");
        const broker = String(data.broker ?? "");
        const transporter = String(data.transporter ?? "");

        const bags = Math.trunc(toNumber(data.bags));
        const totalKgs = toNumber(data.total_kgs);

        return {
          ...data,

          name,
          sale_book: name,

          lot: lotName || null,
          lot_no: lot?.lot_no ?? null,

          party: party || null,
          party_name: party ? (partyMap.get(party) ?? party) : null,

          broker: broker || null,
          broker_name: broker ? (brokerMap.get(broker) ?? broker) : null,

          transporter: transporter || null,
          transporter_name: transporter
            ? (transporterMap.get(transporter) ?? transporter)
            : null,

          bags,
          total_bags: bags,
          total_kgs: totalKgs,

          workflow_state: "Pending" as DispatchStatus,
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

  // --------------------------------------------------
  // Complete Dispatch Book
  //
  // Returns every SaleBook with its associated
  // Dispatch record and correct Dispatch status.
  // --------------------------------------------------

  registry.register(
    "dispatch.get_list",
    async (ctx) => {
      const app = await getNodra();
      const { limit, offset } = getPagination(ctx);

      const [saleBooks, dispatches, parties, brokers, transporters, lots] =
        await Promise.all([
          app.orm.getList("SaleBook", { limit: 1000, offset: 0 }),
          app.orm.getList("Dispatch", { limit: 1000, offset: 0 }),
          app.orm.getList("Party", { limit: 1000, offset: 0 }),
          app.orm.getList("Broker", { limit: 1000, offset: 0 }),
          app.orm.getList("Transporter", { limit: 1000, offset: 0 }),
          app.orm.getList("Lots", { limit: 1000, offset: 0 }),
        ]);

      const dispatchMap = buildDispatchMap(dispatches);

      const partyMap = getTitleMap(parties);
      const brokerMap = getTitleMap(brokers);
      const transporterMap = getTitleMap(transporters);
      const lotMap = buildLotMap(lots);

      const allSaleBooks = saleBooks.map(
        (document) => serialise(document) as DocumentData,
      );

      // Only include SaleBooks that have a non-cancelled Dispatch.
      const dispatchedSaleBooks = allSaleBooks.filter((data) => {
        const saleBookName = String(data.name ?? "");
        const dispatch = dispatchMap.get(saleBookName);

        if (!dispatch) return false;

        const docstatus = Number(dispatch.docstatus ?? 0);

        // Cancelled Dispatch records should not appear in Dispatch Book.
        return docstatus !== 98;
      });

      const totalCount = dispatchedSaleBooks.length;

      // Apply pagination after filtering.
      const paginatedSaleBooks = dispatchedSaleBooks.slice(
        offset,
        offset + limit,
      );

      const documents = paginatedSaleBooks.map((data) => {
        const saleBookName = String(data.name ?? "");

        const dispatch = dispatchMap.get(saleBookName)!;

        // Lot information comes from SaleBook.
        const lotName = String(data.lot ?? "");
        const lot = lotMap.get(lotName);

        // Dispatch-related links come from Dispatch.
        const party = String(dispatch.party ?? "");
        const transporter = String(dispatch.transporter ?? "");

        // Broker and sale quantities come from SaleBook.
        const broker = String(data.broker ?? "");
        const soldBags = Math.trunc(toNumber(data.sold_bags));
        const soldQuantity = toNumber(data.sold_quantity);
        const rate = toNumber(data.rate);

        const status = getDispatchStatus(dispatch);

        return {
          // Preserve SaleBook information.
          ...data,

          // Keep SaleBook and Dispatch identities separate.
          name: dispatch.name ?? null,
          sale_book: saleBookName,

          // Lot information.
          lot: lotName || null,
          lot_no: lot?.lot_no ?? null,

          // Buyer information from Dispatch.
          party: party || null,
          party_name: party ? (partyMap.get(party) ?? party) : null,

          // Broker information from SaleBook.
          broker: broker || null,
          broker_name: broker ? (brokerMap.get(broker) ?? broker) : null,

          // Dispatch information.
          dispatch,
          dispatch_name: dispatch.name ?? null,
          dispatch_date: dispatch.dispatch_date ?? null,
          received_date: dispatch.received_date ?? null,

          billing_address: dispatch.billing_address ?? null,
          shipping_address: dispatch.shipping_address ?? null,

          payment_type: dispatch.payment_type ?? null,
          discount_percentage: dispatch.discount_percentage ?? null,

          lr_number: dispatch.lr_number ?? null,
          challan_number: dispatch.challan_number ?? null,
          remarks: dispatch.remarks ?? null,

          workflow_state: status,
          has_dispatch: true,

          // Transport information from Dispatch.
          transporter: transporter || null,
          transporter_name: transporter
            ? (transporterMap.get(transporter) ?? transporter)
            : null,

          // Sale information.
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

  // --------------------------------------------------
  // Get Dispatch by SaleBook
  //
  // Returns an existing Draft or Confirmed Dispatch.
  // Cancelled records are ignored so a new Dispatch
  // can be created for the same SaleBook.
  // --------------------------------------------------

  registry.register(
    "dispatch.get_by_sale_book",
    async (ctx) => {
      const app = await getNodra();

      const saleBookName = String(ctx.args.sale_book ?? "").trim();

      if (!saleBookName) {
        throw new Error("Sale Book is required.");
      }

      const entries = await app.orm.getList("Dispatch", {
        limit: 100,
        offset: 0,
        filters: {
          sale_book: saleBookName,
        },
      });

      const documents = entries
        .map((entry) => serialise(entry) as DocumentData)
        .filter((entry) => getDocStatus(entry) !== 98);

      if (documents.length > 1) {
        throw new Error(
          `Multiple active Dispatch entries exist for SaleBook "${saleBookName}". Please resolve the duplicates.`,
        );
      }

      return {
        document: documents[0] ?? null,
      };
    },
    { requireAuth: true },
  );
}
