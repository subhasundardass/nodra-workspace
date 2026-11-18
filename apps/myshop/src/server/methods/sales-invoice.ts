/**
 * Nodra methods for the "SalesInvoice" doctype.
 *
 * Fetches confirmed Dispatch records that are pending invoicing.
 * Groups pending records by Buyer + Broker.
 */

import type { MethodRegistry } from "nodra";
import type { Filters, ListOptions } from "nodra/orm/crud";
import { company } from "@/config/company";
import { getNodra } from "../nodra-app";
import { serialise } from "../http";

type DocumentData = Record<string, unknown>;

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function isCancelled(data: DocumentData): boolean {
  return Number(data.docstatus) === 98 || data.workflow_state === "Cancelled";
}

function isConfirmed(data: DocumentData): boolean {
  return Number(data.docstatus) === 51 || data.workflow_state === "Confirmed";
}

export function registerSalesInvoiceMethods(registry: MethodRegistry): void {
  /**
   * Get pending invoices.
   *
   * Fetches confirmed Dispatch records that are not already
   * included in a Draft or Confirmed SalesInvoice.
   *
   * Groups records by Buyer + Broker.
   */
  registry.register(
    "salesinvoice.get_pending_invoices",
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
        String(ctx.args.sort_order ?? "asc").toLowerCase() === "desc"
          ? "desc"
          : "asc";

      const dispatchFilters: Filters = {
        docstatus: 51,
      };

      const [dispatches, saleBooks, invoices, parties, brokers, lots] =
        await Promise.all([
          app.orm.getList("Dispatch", {
            limit: 1000,
            offset: 0,
            filters: dispatchFilters,
            orderBy: `dispatch_date ${sortOrder}`,
          }),

          app.orm.getList("SaleBook", {
            limit: 1000,
            offset: 0,
            filters: {
              docstatus: 51,
            },
          }),

          app.orm.getList("SalesInvoice", {
            limit: 1000,
            offset: 0,
            filters: {
              docstatus: ["in", [0, 51]],
            },
          }),

          app.orm.getList("Party", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Broker", {
            limit: 1000,
            offset: 0,
          }),

          app.orm.getList("Lots", {
            limit: 1000,
            offset: 0,
          }),
        ]);

      // --------------------------------------------------
      // Map confirmed SaleBook records.
      // --------------------------------------------------

      const saleBookMap = new Map<string, DocumentData>();

      for (const sale of saleBooks) {
        const data = serialise(sale) as DocumentData;

        if (!isConfirmed(data) || isCancelled(data)) continue;

        const saleName = String(data.name ?? "");

        if (saleName) {
          saleBookMap.set(saleName, data);
        }
      }

      // --------------------------------------------------
      // Identify Dispatch records already invoiced.
      //
      // Draft and Confirmed invoices both reserve their
      // Dispatch records.
      // Cancelled invoices are excluded from this query.
      // --------------------------------------------------

      const invoicedDispatches = new Set<string>();

      for (const invoice of invoices) {
        const data = serialise(invoice) as DocumentData;

        if (isCancelled(data)) continue;

        const items = Array.isArray(data.items) ? data.items : [];

        for (const item of items) {
          const row = item as DocumentData;
          const dispatchName = String(row.dispatch ?? "");

          if (dispatchName) {
            invoicedDispatches.add(dispatchName);
          }
        }
      }

      // --------------------------------------------------
      // Map Party details.
      // --------------------------------------------------

      const partyMap = new Map<string, DocumentData>();

      for (const party of parties) {
        const data = serialise(party) as DocumentData;
        const partyName = String(data.name ?? "");

        if (partyName) {
          partyMap.set(partyName, data);
        }
      }

      // --------------------------------------------------
      // Map Broker details.
      // --------------------------------------------------

      const brokerMap = new Map<string, DocumentData>();

      for (const broker of brokers) {
        const data = serialise(broker) as DocumentData;
        const brokerName = String(data.name ?? "");

        if (brokerName) {
          brokerMap.set(brokerName, data);
        }
      }

      // --------------------------------------------------
      // Map Lot details.
      // --------------------------------------------------

      const lotMap = new Map<string, DocumentData>();

      for (const lot of lots) {
        const data = serialise(lot) as DocumentData;
        const lotName = String(data.name ?? "");

        if (lotName) {
          lotMap.set(lotName, data);
        }
      }

      // --------------------------------------------------
      // Group pending Dispatch records by Buyer + Broker.
      // --------------------------------------------------

      type InvoiceGroup = {
        name: string;
        buyer: string;
        buyer_name: string;
        broker: string;
        broker_name: string;
        buyer_gstin: string;
        billing_address: string;
        shipping_address: string;
        place_of_supply: string;
        dispatch_count: number;
        total_bags: number;
        total_kgs: number;
        dispatches: DocumentData[];
      };

      const groups = new Map<string, InvoiceGroup>();

      for (const dispatch of dispatches) {
        const data = serialise(dispatch) as DocumentData;

        if (!isConfirmed(data) || isCancelled(data)) continue;

        const dispatchName = String(data.name ?? "");
        const saleBookName = String(data.sale_book ?? "");
        const buyerName = String(data.party ?? "");

        if (!dispatchName || !saleBookName || !buyerName) {
          continue;
        }

        // Exclude Dispatch records already invoiced.
        if (invoicedDispatches.has(dispatchName)) {
          continue;
        }

        // Find the linked confirmed SaleBook.
        const sale = saleBookMap.get(saleBookName);

        if (!sale) continue;

        const brokerName = String(sale.broker ?? "");

        if (!brokerName) continue;

        const party = partyMap.get(buyerName);
        const broker = brokerMap.get(brokerName);

        if (!party) continue;

        const lotName = String(sale.lot ?? "");
        const lot = lotMap.get(lotName);

        const groupKey = `${buyerName}::${brokerName}`;

        let group = groups.get(groupKey);

        if (!group) {
          const addressParts = [
            party.address,
            party.city,
            party.state,
            party.pincode,
            party.country,
          ].filter(Boolean);

          const address = addressParts.join(", ");

          group = {
            name: groupKey,

            buyer: buyerName,
            buyer_name: String(party.title ?? buyerName),

            broker: brokerName,
            broker_name: String(broker?.title ?? brokerName),

            buyer_gstin: String(party.gstin ?? ""),

            billing_address: address,
            shipping_address: address,

            place_of_supply: String(party.state ?? ""),

            dispatch_count: 0,
            total_bags: 0,
            total_kgs: 0,

            dispatches: [],
          };

          groups.set(groupKey, group);
        }

        const bags = toNumber(data.total_bags);
        const kgs = toNumber(data.total_kgs);

        group.dispatch_count += 1;
        group.total_bags += bags;
        group.total_kgs += kgs;

        group.dispatches.push({
          // Dispatch information.
          name: dispatchName,
          dispatch: dispatchName,
          dispatch_date: data.dispatch_date,
          received_date: data.received_date,

          // SaleBook reference.
          sale_book: saleBookName,
          sale_date: sale.sale_date,
          sale_type: sale.sale_type,

          // Lot information.
          lot: lotName,
          lot_no: lot?.lot_no ?? "",
          mark_brand: lot?.original_brand ?? "",
          grade: lot?.grade ?? "",

          // Invoice quantities from Dispatch.
          bags,
          kgs,

          // Selling rate from SaleBook.
          rate: toNumber(sale.rate),

          // Additional information.
          payment_type: data.payment_type,
          discount_percentage: toNumber(data.discount_percentage),
        });
      }

      // --------------------------------------------------
      // Sort groups and apply pagination.
      // --------------------------------------------------

      const documents = Array.from(groups.values()).sort((a, b) => {
        const buyerComparison = a.buyer_name.localeCompare(b.buyer_name);

        const comparison =
          buyerComparison || a.broker_name.localeCompare(b.broker_name);

        return sortOrder === "asc" ? comparison : -comparison;
      });

      const totalCount = documents.length;

      const paginatedDocuments = documents.slice(offset, offset + limit);

      return {
        documents: paginatedDocuments,
        limit,
        offset,
        total_count: totalCount,
        total_dispatch_count: documents.reduce(
          (total, group) => total + group.dispatch_count,
          0,
        ),
      };
    },
    { requireAuth: true },
  );

  //Priview
  registry.register(
    "salesinvoice.get_invoice_preview",
    async (ctx) => {
      const app = await getNodra();

      const buyer = String(ctx.args.buyer ?? "");
      const broker = String(ctx.args.broker ?? "");

      if (!buyer || !broker) {
        throw new Error("Buyer and Broker are required.");
      }

      const [
        dispatchRecords,
        saleBookRecords,
        lotRecords,
        invoiceRecords,
        partyRecords,
        brokerRecords,
      ] = await Promise.all([
        app.orm.getList("Dispatch", { limit: 1000, offset: 0 }),
        app.orm.getList("SaleBook", { limit: 1000, offset: 0 }),
        app.orm.getList("Lots", { limit: 1000, offset: 0 }),
        app.orm.getList("SalesInvoice", { limit: 1000, offset: 0 }),
        app.orm.getList("Party", { limit: 1000, offset: 0 }),
        app.orm.getList("Broker", { limit: 1000, offset: 0 }),
      ]);

      // --------------------------------------------------
      // Build document lookup maps
      // --------------------------------------------------

      const buildMap = (records: any[]) => {
        const map = new Map<string, DocumentData>();

        for (const record of records) {
          const data = serialise(record) as DocumentData;

          if (data.name) {
            map.set(String(data.name), data);
          }
        }

        return map;
      };

      const saleBooks = buildMap(saleBookRecords);
      const lots = buildMap(lotRecords);
      const parties = buildMap(partyRecords);
      const brokers = buildMap(brokerRecords);

      // --------------------------------------------------
      // Resolve Buyer and Broker
      // --------------------------------------------------

      const buyerRecord = parties.get(buyer);
      const brokerRecord = brokers.get(broker);

      if (!buyerRecord) {
        throw new Error(`Buyer ${buyer} not found.`);
      }

      if (!brokerRecord) {
        throw new Error(`Broker ${broker} not found.`);
      }

      const buyerName = String(
        buyerRecord.party_name ??
          buyerRecord.title ??
          buyerRecord.name ??
          buyer,
      );

      const brokerName = String(
        brokerRecord.broker_name ??
          brokerRecord.title ??
          brokerRecord.name ??
          broker,
      );

      // --------------------------------------------------
      // Resolve Buyer State
      // --------------------------------------------------

      const stateName = String(buyerRecord.state ?? "").trim();

      const stateRecord = stateName
        ? await app.orm.getDoc("State", stateName)
        : null;

      const stateData = stateRecord
        ? (serialise(stateRecord) as DocumentData)
        : {};

      const stateTitle = String(stateData.state_name ?? stateName);

      // Prefer the explicit GST code.
      // Fall back to Party.state when it already contains a
      // two-digit Indian GST state code, e.g. "19".
      const storedGstCode = String(stateData.gst_state_code ?? "").trim();

      const buyerStateCode = /^\d{2}$/.test(stateName)
        ? stateName
        : storedGstCode;

      // --------------------------------------------------
      // Buyer Address and Details
      // --------------------------------------------------

      const buyerAddress = [
        buyerRecord.address,
        buyerRecord.city,
        buyerRecord.pincode,
        stateTitle,
      ]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .join(", ");

      const buyerDetails = {
        name: buyer,
        title: buyerName,

        gstin: String(buyerRecord.gstin ?? ""),
        pan: String(buyerRecord.pan ?? ""),

        address: buyerAddress,

        state: stateName,
        state_name: stateTitle,
        state_code: buyerStateCode,

        city: String(buyerRecord.city ?? ""),
        pincode: String(buyerRecord.pincode ?? ""),
        country: String(buyerRecord.country ?? "India"),

        phone: String(buyerRecord.phone ?? ""),
        email: String(buyerRecord.email ?? ""),
      };

      // --------------------------------------------------
      // Seller / Company GST Details
      // --------------------------------------------------

      const sellerDetails = {
        name: company.name,
        gstin: company.gstin,
        address: [company.address1, company.address2]
          .filter(Boolean)
          .join(", "),

        state: company.state,
        state_code: String(company.state_code ?? ""),
        phone: company.phone,
        email: company.email,
        website: company.website,
      };

      // --------------------------------------------------
      // Place of Supply and GST Type
      // --------------------------------------------------

      // Buyer state is the initial default.
      // Verify the actual Place of Supply based on the
      // delivery details and applicable GST rules.
      const placeOfSupply = stateName;
      const placeOfSupplyName = stateTitle;
      const placeOfSupplyCode = buyerStateCode;

      const sellerStateCode = String(company.state_code ?? "").trim();

      let isIntraState: boolean | null = null;
      let gstType = "";

      if (sellerStateCode && placeOfSupplyCode) {
        isIntraState = sellerStateCode === placeOfSupplyCode;
        gstType = isIntraState ? "Intra-State" : "Inter-State";
      }

      // --------------------------------------------------
      // Find Dispatches Already Reserved by Invoices
      // Draft and Confirmed invoices reserve Dispatches.
      // Cancelled invoices release their Dispatches.
      // --------------------------------------------------

      const reservedDispatches = new Set<string>();

      for (const record of invoiceRecords) {
        const invoice = serialise(record) as DocumentData;

        const isCancelled =
          invoice.workflow_state === "Cancelled" ||
          Number(invoice.docstatus) === 98;

        if (isCancelled) continue;

        const items = Array.isArray(invoice.items) ? invoice.items : [];

        for (const item of items) {
          if (!item || typeof item !== "object") continue;

          const dispatchName = String((item as DocumentData).dispatch ?? "");

          if (dispatchName) {
            reservedDispatches.add(dispatchName);
          }
        }
      }

      // --------------------------------------------------
      // Find Eligible Dispatches for Buyer + Broker
      // --------------------------------------------------

      const documents = dispatchRecords
        .map((record) => serialise(record) as DocumentData)
        .filter((dispatch) => {
          const isConfirmed =
            dispatch.workflow_state === "Confirmed" ||
            Number(dispatch.docstatus) === 51;

          if (!isConfirmed) return false;

          const dispatchName = String(dispatch.name ?? "");

          if (!dispatchName || reservedDispatches.has(dispatchName)) {
            return false;
          }

          // Buyer must match the Dispatch Party.
          if (String(dispatch.party ?? "") !== buyer) {
            return false;
          }

          const saleBook = saleBooks.get(String(dispatch.sale_book ?? ""));

          if (!saleBook) return false;

          // Broker can be linked through SaleBook or Dispatch.
          const saleBookBroker = String(saleBook.broker ?? "");
          const dispatchBroker = String(dispatch.broker ?? "");

          return saleBookBroker === broker || dispatchBroker === broker;
        })
        .map((dispatch) => {
          const saleBook = saleBooks.get(String(dispatch.sale_book ?? ""))!;

          const lotName = String(saleBook.lot ?? "");
          const lot = lots.get(lotName);

          const bags = toNumber(dispatch.total_bags);
          const kgs = toNumber(dispatch.total_kgs);
          const rate = toNumber(saleBook.rate);

          return {
            // Dispatch identity
            name: String(dispatch.name ?? ""),
            dispatch: String(dispatch.name ?? ""),
            dispatch_date: String(dispatch.dispatch_date ?? ""),

            // Linked documents
            sale_book: String(saleBook.name ?? ""),
            lot: lotName,
            lot_no: String(lot?.lot_no ?? lotName),

            // Lot details
            mark_brand: String(lot?.mark_brand ?? ""),
            grade: String(lot?.grade ?? ""),

            // Dispatch quantities
            bags,
            kgs,

            // Final agreed SaleBook rate
            rate,
            amount: kgs * rate,
          };
        });

      // --------------------------------------------------
      // Return Invoice Preview
      // --------------------------------------------------

      return {
        buyer,
        broker,

        buyer_name: buyerName,
        broker_name: brokerName,

        buyer_details: buyerDetails,
        seller_details: sellerDetails,

        // GST information
        place_of_supply: placeOfSupply,
        place_of_supply_name: placeOfSupplyName,
        place_of_supply_code: placeOfSupplyCode,

        seller_state_code: sellerStateCode,

        is_intra_state: isIntraState,
        gst_type: gstType,
        gst_rate: 5, //This is static becouse we are working only on Tea

        dispatches: documents,
        total_count: documents.length,
      };
    },
    { requireAuth: true },
  );
}
