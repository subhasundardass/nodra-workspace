import { getNodra } from "@/server/nodra-app";
import { Document } from "nodra/core/document/document";
// Import getNodra from your existing app helper.

export class SaleBook extends Document {
  title!: string;

  async beforeValidate(): Promise<void> {
    const doc = (this as any)._data as Record<string, unknown>;

    // Required fields
    if (!doc.lot) {
      throw new Error("Lot is required.");
    }

    if (!doc.sale_date) {
      throw new Error("Sale Date is required.");
    }

    if (!doc.sale_type) {
      throw new Error("Sale Type is required.");
    }

    if (!doc.broker) {
      throw new Error("Broker is required.");
    }

    // Prevent duplicate active SaleBook entries
    const lotId = String(doc.lot);
    const currentName = String(doc.name ?? "");

    const app = await getNodra();

    const existingEntries = await app.orm.getList("SaleBook", {
      filters: {
        lot: lotId,
      },
      limit: 1000,
    });

    const duplicate = existingEntries.find((entry: any) => {
      const status = Number(entry.docstatus ?? 0);

      return entry.name !== currentName && (status === 0 || status === 51);
    });

    if (duplicate) {
      throw new Error(
        `Lot "${lotId}" already has an active Sale Entry (${duplicate.name}).`,
      );
    }

    // Sale date
    const saleDate = new Date(String(doc.sale_date));

    if (Number.isNaN(saleDate.getTime())) {
      throw new Error("Please enter a valid Sale Date.");
    }

    // Sale type
    const allowedSaleTypes = ["Bid", "Advance"];

    if (!allowedSaleTypes.includes(String(doc.sale_type))) {
      throw new Error("Invalid Sale Type.");
    }

    // Selling rate
    const rate = Number(doc.rate);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Selling Rate must be greater than zero.");
    }

    // Remarks
    if (doc.remarks != null && typeof doc.remarks !== "string") {
      throw new Error("Remarks must be valid text.");
    }
  }
}
