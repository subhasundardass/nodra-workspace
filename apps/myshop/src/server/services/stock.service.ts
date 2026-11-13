import { Document } from "nodra";
import type { ORM } from "nodra/orm/crud";
import { getNodra } from "../nodra-app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LocationType = "Factory" | "Warehouse";

export type MovementType =
  | "Opening Stock"
  | "Lot Receipt"
  | "Transfer In"
  | "Transfer Out"
  | "Dispatch"
  | "Adjustment In"
  | "Adjustment Out"
  | "Return In"
  | "Return Out";

export interface StockLocation {
  location_type: LocationType;
  factory?: string;
  warehouse?: string;
}

export interface StockMovement {
  lot: string;
  movement_type: MovementType;
  bags: number;
  quantity: number;

  source?: StockLocation;
  destination?: StockLocation;

  voucher_type: string;
  voucher_no: string;
  voucher_detail_no?: string;

  posting_date?: string;
  remarks?: string;
  against_ledger?: string;
}

export interface LocationStockBalance {
  location: StockLocation;
  bags: number;
  quantity: number;
}

export interface LotStockBalance {
  lot: string;
  locations: LocationStockBalance[];

  factory_bags: number;
  factory_quantity: number;

  warehouse_bags: number;
  warehouse_quantity: number;

  total_bags: number;
  total_quantity: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INWARD_MOVEMENTS: MovementType[] = [
  "Opening Stock",
  "Lot Receipt",
  "Adjustment In",
  "Return In",
];

const OUTWARD_MOVEMENTS: MovementType[] = [
  "Adjustment Out",
  "Dispatch",
  "Return Out",
];

const EPSILON = 0.000001;

// ---------------------------------------------------------------------------
// Stock Service
// ---------------------------------------------------------------------------

export class StockService {
  constructor(private readonly orm: ORM) {}

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  private validateLocation(location: StockLocation): void {
    if (location.location_type === "Factory") {
      if (!location.factory?.trim() || location.warehouse?.trim()) {
        throw new Error("A valid Factory location is required.");
      }
      return;
    }

    if (location.location_type === "Warehouse") {
      if (!location.warehouse?.trim() || location.factory?.trim()) {
        throw new Error("A valid Warehouse location is required.");
      }
      return;
    }

    throw new Error("Invalid stock location.");
  }

  private validateQuantity(bags: number, quantity: number): void {
    if (
      !Number.isSafeInteger(bags) ||
      bags <= 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      throw new Error("Bags and quantity must be positive values.");
    }
  }

  private getNumber(value: unknown): number {
    const number = Number(value ?? 0);

    if (!Number.isFinite(number)) {
      throw new Error("Invalid numeric value in StockLedger.");
    }

    return number;
  }

  private sameLocation(first: StockLocation, second: StockLocation): boolean {
    return (
      first.location_type === second.location_type &&
      (first.factory ?? "").trim() === (second.factory ?? "").trim() &&
      (first.warehouse ?? "").trim() === (second.warehouse ?? "").trim()
    );
  }

  // -------------------------------------------------------------------------
  // Stock Balance
  // -------------------------------------------------------------------------

  /**
   * Calculate stock balance separately for every Factory and Warehouse.
   *
   * StockLedger convention:
   * Inward  = positive bags and quantity
   * Outward = negative bags and quantity
   */
  private calculateBalance(entries: Document[], lot: string): LotStockBalance {
    const balance: LotStockBalance = {
      lot,
      locations: [],

      factory_bags: 0,
      factory_quantity: 0,

      warehouse_bags: 0,
      warehouse_quantity: 0,

      total_bags: 0,
      total_quantity: 0,
    };

    const locationBalances = new Map<string, LocationStockBalance>();

    for (const entry of entries) {
      const locationType = entry.get("location_type");

      if (locationType !== "Factory" && locationType !== "Warehouse") {
        throw new Error(`Invalid stock location type for Lot ${lot}.`);
      }

      const factory = String(entry.get("factory") ?? "").trim();
      const warehouse = String(entry.get("warehouse") ?? "").trim();

      const location: StockLocation = {
        location_type: locationType,
        factory: factory || undefined,
        warehouse: warehouse || undefined,
      };

      this.validateLocation(location);

      const locationKey = locationType === "Factory" ? factory : warehouse;

      const key = `${locationType}:${locationKey}`;

      const current = locationBalances.get(key) ?? {
        location,
        bags: 0,
        quantity: 0,
      };

      current.bags += this.getNumber(entry.get("bags"));
      current.quantity += this.getNumber(entry.get("quantity"));

      locationBalances.set(key, current);
    }

    // Validate each location independently.
    for (const current of locationBalances.values()) {
      if (current.bags < 0 || current.quantity < -EPSILON) {
        throw new Error(
          `Invalid negative stock balance for Lot ${lot} at ${current.location.location_type}.`,
        );
      }

      // Remove minor floating-point residue.
      if (Math.abs(current.quantity) < EPSILON) {
        current.quantity = 0;
      }

      balance.locations.push(current);

      if (current.location.location_type === "Factory") {
        balance.factory_bags += current.bags;
        balance.factory_quantity += current.quantity;
      } else {
        balance.warehouse_bags += current.bags;
        balance.warehouse_quantity += current.quantity;
      }
    }

    balance.total_bags = balance.factory_bags + balance.warehouse_bags;

    balance.total_quantity =
      balance.factory_quantity + balance.warehouse_quantity;

    return balance;
  }

  /**
   * Get current stock balance across all locations.
   */
  async getLotStockBalance(lot: string): Promise<LotStockBalance> {
    const lotName = lot?.trim();

    if (!lotName) {
      throw new Error("Lot is required.");
    }

    const entries = await this.orm.getList("StockLedger", {
      filters: { lot: lotName },
    });

    return this.calculateBalance(entries, lotName);
  }

  /**
   * Get stock balance for one specific location.
   */
  private getLocationBalance(
    entries: Document[],
    lot: string,
    location: StockLocation,
  ): LocationStockBalance {
    this.validateLocation(location);

    let bags = 0;
    let quantity = 0;

    for (const entry of entries) {
      const locationType = entry.get("location_type");

      if (locationType !== "Factory" && locationType !== "Warehouse") {
        throw new Error(`Invalid stock location type for Lot ${lot}.`);
      }

      const entryLocation: StockLocation = {
        location_type: locationType,
        factory: String(entry.get("factory") ?? "").trim() || undefined,
        warehouse: String(entry.get("warehouse") ?? "").trim() || undefined,
      };

      if (!this.sameLocation(entryLocation, location)) {
        continue;
      }

      bags += this.getNumber(entry.get("bags"));
      quantity += this.getNumber(entry.get("quantity"));
    }

    if (bags < 0 || quantity < -EPSILON) {
      throw new Error(
        `Invalid negative stock balance for Lot ${lot} at ${location.location_type}.`,
      );
    }

    return {
      location,
      bags: Math.max(0, bags),
      quantity: Math.abs(quantity) < EPSILON ? 0 : Math.max(0, quantity),
    };
  }

  // -------------------------------------------------------------------------
  // Sale Eligibility
  // -------------------------------------------------------------------------

  async validateLotForSale(lot: string): Promise<LotStockBalance> {
    const lotName = lot?.trim();

    if (!lotName) {
      throw new Error("Lot is required.");
    }

    const document = await this.orm.getDoc("Lots", lotName);

    if (!document) {
      throw new Error(`Lot ${lotName} not found.`);
    }

    if (Number(document.get("docstatus")) !== 51) {
      throw new Error("Only confirmed Lots can be selected for Sale Entry.");
    }

    const balance = await this.getLotStockBalance(lotName);

    if (balance.factory_bags <= 0 || balance.factory_quantity <= EPSILON) {
      throw new Error("This Lot does not have available Factory stock.");
    }

    if (balance.warehouse_bags !== 0 || balance.warehouse_quantity > EPSILON) {
      throw new Error(
        "This Lot has stock in Warehouse and cannot be selected for Sale Entry.",
      );
    }

    return balance;
  }

  // -------------------------------------------------------------------------
  // Stock Movement
  // -------------------------------------------------------------------------

  async moveStock(movement: StockMovement): Promise<void> {
    const {
      lot,
      movement_type,
      bags,
      quantity,
      source,
      destination,
      voucher_type,
      voucher_no,
      voucher_detail_no,
      posting_date,
      remarks,
      against_ledger,
    } = movement;

    const lotName = String(lot ?? "").trim();
    const voucherType = String(voucher_type ?? "").trim();
    const voucherNo = String(voucher_no ?? "").trim();

    this.validateQuantity(bags, quantity);

    if (!lotName || !voucherType || !voucherNo) {
      throw new Error("Lot and voucher details are required.");
    }

    const isInward = INWARD_MOVEMENTS.includes(movement_type);
    const isOutward = OUTWARD_MOVEMENTS.includes(movement_type);
    const isTransfer = movement_type === "Transfer Out";

    if (!isInward && !isOutward && !isTransfer) {
      throw new Error("Unsupported stock movement type.");
    }

    await this.orm.transaction(async (tx) => {
      // Verify Lot exists.
      const lotDocument = await tx.getDoc("Lots", lotName);

      if (!lotDocument) {
        throw new Error(`Lot ${lotName} not found.`);
      }

      // Opening Stock and Lot Receipt can initialize stock.
      if (
        !["Opening Stock", "Lot Receipt"].includes(movement_type) &&
        Number(lotDocument.get("docstatus")) !== 51
      ) {
        throw new Error("Only confirmed Lots can have stock movements.");
      }

      // Prevent duplicate movement posting.
      const existing = await tx.getList("StockLedger", {
        filters: {
          voucher_type: voucherType,
          voucher_no: voucherNo,
          voucher_detail_no: voucher_detail_no ?? "",
          movement_type,
        },
        limit: 1,
      });

      if (existing.length > 0) {
        throw new Error(
          `Stock movement already posted for ${voucherType} ${voucherNo}.`,
        );
      }

      const nodra = await getNodra();
      const meta = nodra.registry.get("StockLedger");

      // Insert a signed StockLedger entry.
      const insertEntry = async (
        location: StockLocation,
        type: MovementType,
        sign: 1 | -1,
      ): Promise<void> => {
        this.validateLocation(location);

        const doc = new Document(meta, {
          posting_date: posting_date ?? new Date().toISOString().slice(0, 10),

          lot: lotName,

          location_type: location.location_type,
          factory: location.factory ?? "",
          warehouse: location.warehouse ?? "",

          movement_type: type,

          bags: bags * sign,
          quantity: quantity * sign,

          voucher_type: voucherType,
          voucher_no: voucherNo,
          voucher_detail_no: voucher_detail_no ?? "",

          is_reversal: false,
          against_ledger: against_ledger ?? "",
          remarks: remarks ?? "",
        });

        await tx.insert(doc);
      };

      // Load entries within the transaction for stock validation.
      const loadEntries = async (): Promise<Document[]> =>
        tx.getList("StockLedger", {
          filters: { lot: lotName },
        });

      // Check stock at the requested source location.
      const checkAvailableStock = async (
        location: StockLocation,
      ): Promise<void> => {
        const entries = await loadEntries();

        const balance = this.getLocationBalance(entries, lotName, location);

        if (balance.bags < bags || balance.quantity + EPSILON < quantity) {
          throw new Error(
            `Insufficient stock for Lot ${lotName}. ` +
              `Available: ${balance.bags} bags / ${balance.quantity} KG.`,
          );
        }
      };

      // Factory / Warehouse transfer.
      if (isTransfer) {
        if (!source || !destination) {
          throw new Error(
            "Source and destination locations are required for transfer.",
          );
        }

        this.validateLocation(source);
        this.validateLocation(destination);

        if (this.sameLocation(source, destination)) {
          throw new Error("Source and destination cannot be the same.");
        }

        await checkAvailableStock(source);

        await insertEntry(source, "Transfer Out", -1);
        await insertEntry(destination, "Transfer In", 1);

        return;
      }

      // Inward movement.
      if (isInward) {
        if (!destination) {
          throw new Error("Destination location is required.");
        }

        await insertEntry(destination, movement_type, 1);
        return;
      }

      // Outward movement.
      if (isOutward) {
        if (!source) {
          throw new Error("Source location is required.");
        }

        await checkAvailableStock(source);

        await insertEntry(source, movement_type, -1);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Location Balances
  // -------------------------------------------------------------------------

  async getLocationBalances(params: {
    fromDate: string;
    toDate: string;
    locationType?: LocationType;
  }) {
    const { fromDate, toDate, locationType } = params;

    if (!fromDate || !toDate || fromDate > toDate) {
      throw new Error("Invalid stock date range.");
    }

    if (
      locationType &&
      locationType !== "Factory" &&
      locationType !== "Warehouse"
    ) {
      throw new Error("Invalid location type.");
    }

    // Fetch all ledger entries up to the selected To Date.
    const entries = await this.orm.getList("StockLedger", {
      filters: {
        posting_date: ["<=", toDate],
      },
    });

    const locations = new Map<
      string,
      {
        location: StockLocation;
        opening_bags: number;
        opening_quantity: number;
        stock_in_bags: number;
        stock_in_quantity: number;
        stock_out_bags: number;
        stock_out_quantity: number;
        closing_bags: number;
        closing_quantity: number;
      }
    >();

    for (const entry of entries) {
      const type = entry.get("location_type");

      if (type !== "Factory" && type !== "Warehouse") {
        continue;
      }

      if (locationType && type !== locationType) {
        continue;
      }

      const location: StockLocation = {
        location_type: type,
        factory: String(entry.get("factory") ?? "").trim() || undefined,
        warehouse: String(entry.get("warehouse") ?? "").trim() || undefined,
      };

      this.validateLocation(location);

      const name = type === "Factory" ? location.factory! : location.warehouse!;

      const key = `${type}:${name}`;

      if (!locations.has(key)) {
        locations.set(key, {
          location,
          opening_bags: 0,
          opening_quantity: 0,
          stock_in_bags: 0,
          stock_in_quantity: 0,
          stock_out_bags: 0,
          stock_out_quantity: 0,
          closing_bags: 0,
          closing_quantity: 0,
        });
      }

      const row = locations.get(key)!;

      const bags = this.getNumber(entry.get("bags"));
      const quantity = this.getNumber(entry.get("quantity"));
      const postingDate = String(entry.get("posting_date") ?? "");

      if (postingDate < fromDate) {
        row.opening_bags += bags;
        row.opening_quantity += quantity;
      } else {
        if (bags > 0) {
          row.stock_in_bags += bags;
          row.stock_in_quantity += quantity;
        } else if (bags < 0) {
          row.stock_out_bags += Math.abs(bags);
          row.stock_out_quantity += Math.abs(quantity);
        }
      }

      row.closing_bags += bags;
      row.closing_quantity += quantity;
    }

    return Array.from(locations.values())
      .filter(
        (row) =>
          row.opening_bags !== 0 ||
          row.stock_in_bags !== 0 ||
          row.stock_out_bags !== 0 ||
          row.closing_bags !== 0,
      )
      .sort((a, b) => {
        const aName = a.location.factory ?? a.location.warehouse ?? "";
        const bName = b.location.factory ?? b.location.warehouse ?? "";
        return aName.localeCompare(bName);
      });
  }
}
