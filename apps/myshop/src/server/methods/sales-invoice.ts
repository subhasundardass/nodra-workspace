/**
 * Nodra methods for the "SalesInvoice" doctype.
 *
 * Fetches confirmed Dispatch records that are pending invoicing.
 * Groups pending records by Buyer + Broker.
 *
 * Billing and Shipping addresses are read from Dispatch snapshots,
 * preserving the addresses saved when each Dispatch was created.
 */

import type { MethodRegistry } from "nodra";
import type { Filters } from "nodra/orm/crud";
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

function getText(value: unknown): string {
  return String(value ?? "").trim();
}

function buildMap(records: unknown[]): Map<string, DocumentData> {
  const map = new Map<string, DocumentData>();

  for (const record of records) {
    const data = serialise(record) as DocumentData;
    const name = getText(data.name);

    if (name) {
      map.set(name, data);
    }
  }

  return map;
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
        getText(ctx.args.sort_order).toLowerCase() === "desc" ? "desc" : "asc";

      const dispatchFilters: Filters = {
        docstatus: 51,
      };

      const [
        dispatchRecords,
        saleBookRecords,
        invoiceRecords,
        partyRecords,
        brokerRecords,
        lotRecords,
      ] = await Promise.all([
        app.orm.getList("Dispatch", {
          limit: 1000,
          offset: 0,
          filters: dispatchFilters,
          orderBy: `dispatch_date ${sortOrder}`,
        }),

        app.orm.getList("SaleBook", {
          limit: 1000,
          offset: 0,
          filters: { docstatus: 51 },
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
      // Build lookup maps.
      // --------------------------------------------------

      const saleBookMap = buildMap(saleBookRecords);
      const partyMap = buildMap(partyRecords);
      const brokerMap = buildMap(brokerRecords);
      const lotMap = buildMap(lotRecords);

      // --------------------------------------------------
      // Identify Dispatch records already invoiced.
      //
      // Draft and Confirmed invoices reserve Dispatches.
      // Cancelled invoices release their Dispatches.
      // --------------------------------------------------

      const invoicedDispatches = new Set<string>();

      for (const invoiceRecord of invoiceRecords) {
        const invoice = serialise(invoiceRecord) as DocumentData;

        if (isCancelled(invoice)) continue;

        const items = Array.isArray(invoice.items) ? invoice.items : [];

        for (const item of items) {
          if (!item || typeof item !== "object") continue;

          const dispatchName = getText((item as DocumentData).dispatch);

          if (dispatchName) {
            invoicedDispatches.add(dispatchName);
          }
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

      for (const dispatchRecord of dispatchRecords) {
        const dispatch = serialise(dispatchRecord) as DocumentData;

        if (!isConfirmed(dispatch) || isCancelled(dispatch)) continue;

        const dispatchName = getText(dispatch.name);
        const saleBookName = getText(dispatch.sale_book);
        const buyerName = getText(dispatch.party);

        if (!dispatchName || !saleBookName || !buyerName) continue;

        // Exclude Dispatches already reserved by invoices.
        if (invoicedDispatches.has(dispatchName)) continue;

        // Find the linked confirmed SaleBook.
        const sale = saleBookMap.get(saleBookName);

        if (!sale || !isConfirmed(sale) || isCancelled(sale)) continue;

        const brokerName = getText(sale.broker);

        if (!brokerName) continue;

        const party = partyMap.get(buyerName);
        const broker = brokerMap.get(brokerName);

        if (!party) continue;

        const lotName = getText(sale.lot);
        const lot = lotMap.get(lotName);

        const groupKey = `${buyerName}::${brokerName}`;

        let group = groups.get(groupKey);

        if (!group) {
          group = {
            name: groupKey,

            buyer: buyerName,
            buyer_name: getText(party.party_name || party.title || buyerName),

            broker: brokerName,
            broker_name: getText(
              broker?.broker_name || broker?.title || brokerName,
            ),

            buyer_gstin: getText(party.gstin),

            // Addresses come from the Dispatch snapshot.
            billing_address: getText(dispatch.billing_address),
            shipping_address: getText(dispatch.shipping_address),

            // GST state remains sourced from Party master.
            place_of_supply: getText(party.state),

            dispatch_count: 0,
            total_bags: 0,
            total_kgs: 0,

            dispatches: [],
          };

          groups.set(groupKey, group);
        }

        const bags = toNumber(dispatch.total_bags);
        const kgs = toNumber(dispatch.total_kgs);

        group.dispatch_count += 1;
        group.total_bags += bags;
        group.total_kgs += kgs;

        group.dispatches.push({
          // Dispatch information.
          name: dispatchName,
          dispatch: dispatchName,
          dispatch_date: dispatch.dispatch_date,
          received_date: dispatch.received_date,

          // Dispatch address snapshots.
          billing_address: getText(dispatch.billing_address),
          shipping_address: getText(dispatch.shipping_address),

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
          payment_type: dispatch.payment_type,
          discount_percentage: toNumber(dispatch.discount_percentage),
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

  /**
   * Get invoice preview.
   *
   * Returns eligible Dispatch records for the selected Buyer + Broker.
   * Billing and Shipping addresses come from the Dispatch snapshots.
   */
  registry.register(
    "salesinvoice.get_invoice_preview",
    async (ctx) => {
      const app = await getNodra();

      const buyer = getText(ctx.args.buyer);
      const broker = getText(ctx.args.broker);

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
        app.orm.getList("Dispatch", {
          limit: 1000,
          offset: 0,
        }),

        app.orm.getList("SaleBook", {
          limit: 1000,
          offset: 0,
        }),

        app.orm.getList("Lots", {
          limit: 1000,
          offset: 0,
        }),

        app.orm.getList("SalesInvoice", {
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
        app.orm.getList("Factory", {
          limit: 1000,
          offset: 0,
        }),

        app.orm.getList("StockLedger", {
          limit: 10000,
          offset: 0,
        }),
      ]);

      // --------------------------------------------------
      // Build lookup maps.
      // --------------------------------------------------

      const saleBooks = buildMap(saleBookRecords);
      const lots = buildMap(lotRecords);
      const parties = buildMap(partyRecords);
      const brokers = buildMap(brokerRecords);

      // --------------------------------------------------
      // Resolve Buyer and Broker.
      // --------------------------------------------------

      const buyerRecord = parties.get(buyer);
      const brokerRecord = brokers.get(broker);

      if (!buyerRecord) {
        throw new Error(`Buyer ${buyer} not found.`);
      }

      if (!brokerRecord) {
        throw new Error(`Broker ${broker} not found.`);
      }

      const buyerName = getText(
        buyerRecord.party_name ||
          buyerRecord.title ||
          buyerRecord.name ||
          buyer,
      );

      const brokerName = getText(
        brokerRecord.broker_name ||
          brokerRecord.title ||
          brokerRecord.name ||
          broker,
      );

      // --------------------------------------------------
      // Resolve Buyer State.
      // --------------------------------------------------

      const stateName = getText(buyerRecord.state);

      const stateRecord = stateName
        ? await app.orm.getDoc("State", stateName)
        : null;

      const stateData = stateRecord
        ? (serialise(stateRecord) as DocumentData)
        : {};

      const stateTitle = getText(stateData.state_name) || stateName;

      const storedGstCode = getText(stateData.gst_state_code);

      const buyerStateCode = /^\d{2}$/.test(stateName)
        ? stateName
        : storedGstCode;

      // --------------------------------------------------
      // Find Dispatches Already Reserved by Invoices.
      //
      // Draft and Confirmed invoices reserve Dispatches.
      // Cancelled invoices release their Dispatches.
      // --------------------------------------------------

      const reservedDispatches = new Set<string>();

      for (const invoiceRecord of invoiceRecords) {
        const invoice = serialise(invoiceRecord) as DocumentData;

        if (isCancelled(invoice)) continue;

        const items = Array.isArray(invoice.items) ? invoice.items : [];

        for (const item of items) {
          if (!item || typeof item !== "object") continue;

          const dispatchName = getText((item as DocumentData).dispatch);

          if (dispatchName) {
            reservedDispatches.add(dispatchName);
          }
        }
      }

      // --------------------------------------------------
      // Find Eligible Dispatches for Buyer + Broker.
      // --------------------------------------------------

      const documents = dispatchRecords
        .map((record) => serialise(record) as DocumentData)
        .filter((dispatch) => {
          if (!isConfirmed(dispatch) || isCancelled(dispatch)) {
            return false;
          }

          const dispatchName = getText(dispatch.name);

          if (!dispatchName || reservedDispatches.has(dispatchName)) {
            return false;
          }

          // Buyer must match the Dispatch Party.
          if (getText(dispatch.party) !== buyer) {
            return false;
          }

          const saleBook = saleBooks.get(getText(dispatch.sale_book));

          if (!saleBook || !isConfirmed(saleBook) || isCancelled(saleBook)) {
            return false;
          }

          // Broker is linked through the SaleBook.
          return getText(saleBook.broker) === broker;
        })
        .map((dispatch) => {
          const saleBook = saleBooks.get(getText(dispatch.sale_book))!;

          const lotName = getText(saleBook.lot);
          const lot = lots.get(lotName);

          const bags = toNumber(dispatch.total_bags);
          const kgs = toNumber(dispatch.total_kgs);
          const rate = toNumber(saleBook.rate);

          return {
            // Dispatch identity.
            name: getText(dispatch.name),
            dispatch: getText(dispatch.name),
            dispatch_date: getText(dispatch.dispatch_date),

            // Address snapshots from Dispatch.
            billing_address: getText(dispatch.billing_address),
            shipping_address: getText(dispatch.shipping_address),

            // Linked documents.
            sale_book: getText(saleBook.name),
            lot: lotName,
            lot_no: getText(lot?.lot_no) || lotName,

            // Lot details.
            mark_brand: getText(lot?.mark_brand),
            grade: getText(lot?.grade),

            // Dispatch quantities.
            bags,
            kgs,

            // Final agreed SaleBook rate.
            rate,
            amount: kgs * rate,
          };
        });

      // --------------------------------------------------
      // Buyer Address and Details.
      //
      // Use the first eligible Dispatch as the invoice
      // address source. Never rebuild it from Party master.
      // --------------------------------------------------

      const firstDispatch = documents[0];

      const billingAddress = getText(firstDispatch?.billing_address);

      const shippingAddress = getText(firstDispatch?.shipping_address);

      const buyerDetails = {
        name: buyer,
        title: buyerName,

        gstin: getText(buyerRecord.gstin),
        pan: getText(buyerRecord.pan),

        // Compatibility field for existing invoice UI.
        address: billingAddress,

        billing_address: billingAddress,
        shipping_address: shippingAddress,

        // Party master remains the source for GST state.
        state: stateName,
        state_name: stateTitle,
        state_code: buyerStateCode,

        city: getText(buyerRecord.city),
        pincode: getText(buyerRecord.pincode),
        country: getText(buyerRecord.country) || "India",

        phone: getText(buyerRecord.phone),
        email: getText(buyerRecord.email),
      };

      // --------------------------------------------------
      // Seller / Company GST Details.
      // --------------------------------------------------

      const sellerDetails = {
        name: company.name,
        gstin: company.gstin,

        address: [company.address1, company.address2]
          .filter(Boolean)
          .join(", "),

        state: company.state,
        state_code: getText(company.state_code),
        phone: company.phone,
        email: company.email,
        website: company.website,
      };

      // --------------------------------------------------
      // Place of Supply and GST Type.
      // --------------------------------------------------

      const placeOfSupply = stateName;
      const placeOfSupplyName = stateTitle;
      const placeOfSupplyCode = buyerStateCode;

      const sellerStateCode = getText(company.state_code);

      let isIntraState: boolean | null = null;
      let gstType = "";

      if (sellerStateCode && placeOfSupplyCode) {
        isIntraState = sellerStateCode === placeOfSupplyCode;
        gstType = isIntraState ? "Intra-State" : "Inter-State";
      }

      // --------------------------------------------------
      // Return Invoice Preview.
      // --------------------------------------------------

      return {
        buyer,
        broker,

        buyer_name: buyerName,
        broker_name: brokerName,

        buyer_details: buyerDetails,
        seller_details: sellerDetails,

        // GST information.
        place_of_supply: placeOfSupply,
        place_of_supply_name: placeOfSupplyName,
        place_of_supply_code: placeOfSupplyCode,

        seller_state_code: sellerStateCode,

        is_intra_state: isIntraState,
        gst_type: gstType,
        gst_rate: 5, // Tea GST rate.

        dispatches: documents,
        total_count: documents.length,
      };
    },
    { requireAuth: true },
  );
}
