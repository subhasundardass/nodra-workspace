/**
 * StockLedger methods.
 *
 * Responsibilities:
 * - Post stock movements.
 * - Transfer stock between Factory and Warehouse.
 * - Calculate current stock balances.
 * - Prevent negative stock.
 * - Validate Lot availability for Sale Entry.
 */

import { Document } from "nodra";
import { ORM } from "nodra/orm/crud";
import { getNodra } from "../nodra-app";
import type { MethodRegistry } from "nodra";

type LocationType = "Factory" | "Warehouse";

type MovementType =
  | "Opening Stock"
  | "Lot Receipt"
  | "Transfer In"
  | "Transfer Out"
  | "Dispatch"
  | "Adjustment In"
  | "Adjustment Out"
  | "Return In"
  | "Return Out";

interface StockLocation {
  location_type: LocationType;
  factory?: string;
  warehouse?: string;
}

interface StockMovement {
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

export interface LotStockBalance {
  lot: string;
  factory_bags: number;
  factory_quantity: number;
  warehouse_bags: number;
  warehouse_quantity: number;
  total_bags: number;
  total_quantity: number;
}

interface StockEntry {
  location_type: LocationType;
  factory: string;
  warehouse: string;
  bags: number;
  quantity: number;
}

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
// Validation
// ---------------------------------------------------------------------------

function validateLocation(location: StockLocation): void {
  if (location.location_type === "Factory") {
    if (!location.factory || location.warehouse) {
      throw new Error("A valid Factory location is required.");
    }
    return;
  }

  if (location.location_type === "Warehouse") {
    if (!location.warehouse || location.factory) {
      throw new Error("A valid Warehouse location is required.");
    }
    return;
  }

  throw new Error("Invalid stock location.");
}

function validateQuantity(bags: number, quantity: number): void {
  if (
    !Number.isInteger(bags) ||
    bags <= 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error("Bags and quantity must be positive values.");
  }
}

function getNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function sameLocation(first: StockLocation, second: StockLocation): boolean {
  return (
    first.location_type === second.location_type &&
    (first.factory ?? "") === (second.factory ?? "") &&
    (first.warehouse ?? "") === (second.warehouse ?? "")
  );
}

// ---------------------------------------------------------------------------
// Stock balance calculation
// ---------------------------------------------------------------------------

async function calculateBalance(
  loadEntries: () => Promise<Document[]>,
  lot: string,
): Promise<LotStockBalance> {
  const entries = await loadEntries();

  const balance: LotStockBalance = {
    lot,
    factory_bags: 0,
    factory_quantity: 0,
    warehouse_bags: 0,
    warehouse_quantity: 0,
    total_bags: 0,
    total_quantity: 0,
  };

  for (const entry of entries) {
    const locationType = entry.get("location_type");
    const bags = getNumber(entry.get("bags"));
    const quantity = getNumber(entry.get("quantity"));

    if (locationType === "Factory") {
      balance.factory_bags += bags;
      balance.factory_quantity += quantity;
    } else if (locationType === "Warehouse") {
      balance.warehouse_bags += bags;
      balance.warehouse_quantity += quantity;
    }
  }

  balance.total_bags = balance.factory_bags + balance.warehouse_bags;

  balance.total_quantity =
    balance.factory_quantity + balance.warehouse_quantity;

  return balance;
}

/**
 * Get current stock balance of a Lot across all locations.
 *
 * Ledger quantities are already signed:
 * Inward = positive
 * Outward = negative
 */
export async function getLotStockBalance(
  orm: ORM,
  lot: string,
): Promise<LotStockBalance> {
  if (!lot) {
    throw new Error("Lot is required.");
  }

  return calculateBalance(
    () =>
      orm.getList("StockLedger", {
        filters: { lot },
      }),
    lot,
  );
}

// ---------------------------------------------------------------------------
// Location-specific balance
// ---------------------------------------------------------------------------

async function getLocationBalance(
  loadEntries: () => Promise<Document[]>,
  lot: string,
  location: StockLocation,
): Promise<{ bags: number; quantity: number }> {
  const entries = await loadEntries();

  let bags = 0;
  let quantity = 0;

  for (const entry of entries) {
    const entryLocation: StockLocation = {
      location_type: entry.get("location_type") as LocationType,
      factory: String(entry.get("factory") ?? "") || undefined,
      warehouse: String(entry.get("warehouse") ?? "") || undefined,
    };

    if (!sameLocation(entryLocation, location)) {
      continue;
    }

    bags += getNumber(entry.get("bags"));
    quantity += getNumber(entry.get("quantity"));
  }

  if (bags < 0 || quantity < -EPSILON) {
    throw new Error(`Invalid negative stock balance for Lot ${lot}.`);
  }

  return {
    bags: Math.max(0, bags),
    quantity: Math.max(0, quantity),
  };
}

// ---------------------------------------------------------------------------
// Sale eligibility
// ---------------------------------------------------------------------------

export async function validateLotForSale(
  orm: ORM,
  lot: string,
): Promise<LotStockBalance> {
  const document = await orm.getDoc("Lots", lot);

  if (Number(document.get("docstatus")) !== 51) {
    throw new Error("Only confirmed Lots can be selected for Sale Entry.");
  }

  const balance = await getLotStockBalance(orm, lot);

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

// ---------------------------------------------------------------------------
// Stock movement
// ---------------------------------------------------------------------------

export async function moveStock(
  orm: ORM,
  movement: StockMovement,
): Promise<void> {
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

  validateQuantity(bags, quantity);

  if (!lot || !voucher_type || !voucher_no) {
    throw new Error("Lot and voucher details are required.");
  }

  if (
    !INWARD_MOVEMENTS.includes(movement_type) &&
    !OUTWARD_MOVEMENTS.includes(movement_type) &&
    movement_type !== "Transfer Out"
  ) {
    throw new Error("Unsupported stock movement type.");
  }

  await orm.transaction(async (tx) => {
    // Verify Lot exists.
    const lotDocument = await tx.getDoc("Lots", lot);

    // Check duplicate voucher movement.
    const existing = await tx.getList("StockLedger", {
      filters: {
        voucher_type,
        voucher_no,
        voucher_detail_no: voucher_detail_no ?? "",
        movement_type,
      },
      limit: 1,
    });

    if (existing.length > 0) {
      throw new Error(
        `Stock movement already posted for ${voucher_type} ${voucher_no}.`,
      );
    }

    const nodra = await getNodra();
    const meta = nodra.registry.get("StockLedger");

    // Insert signed ledger entry.
    const insertEntry = async (
      location: StockLocation,
      type: MovementType,
      sign: 1 | -1,
    ): Promise<void> => {
      validateLocation(location);

      const doc = new Document(meta, {
        posting_date: posting_date ?? new Date().toISOString().slice(0, 10),

        lot,

        location_type: location.location_type,
        factory: location.factory ?? "",
        warehouse: location.warehouse ?? "",

        movement_type: type,

        bags: bags * sign,
        quantity: quantity * sign,

        voucher_type,
        voucher_no,
        voucher_detail_no: voucher_detail_no ?? "",

        is_reversal: false,
        against_ledger: against_ledger ?? "",
        remarks: remarks ?? "",
      });

      await tx.insert(doc);
    };

    // Check available stock before an outward movement.
    const checkAvailableStock = async (
      location: StockLocation,
    ): Promise<void> => {
      validateLocation(location);

      const balance = await getLocationBalance(
        () =>
          tx.getList("StockLedger", {
            filters: { lot },
          }),
        lot,
        location,
      );

      if (balance.bags < bags || balance.quantity + EPSILON < quantity) {
        throw new Error(
          `Insufficient stock for Lot ${lot}. Available: ${balance.bags} bags, ${balance.quantity} KG.`,
        );
      }
    };

    // Lot must be confirmed before stock posting.
    if (
      !["Opening Stock", "Lot Receipt"].includes(movement_type) &&
      Number(lotDocument.get("docstatus")) !== 51
    ) {
      throw new Error("Only confirmed Lots can have stock movements.");
    }

    // -----------------------------------------------------------------------
    // Factory / Warehouse transfer
    // -----------------------------------------------------------------------

    if (movement_type === "Transfer Out") {
      if (!source || !destination) {
        throw new Error(
          "Source and destination locations are required for transfer.",
        );
      }

      validateLocation(source);
      validateLocation(destination);

      if (sameLocation(source, destination)) {
        throw new Error("Source and destination cannot be the same.");
      }

      await checkAvailableStock(source);

      // Both entries are committed or rolled back together.
      await insertEntry(source, "Transfer Out", -1);
      await insertEntry(destination, "Transfer In", 1);

      return;
    }

    // -----------------------------------------------------------------------
    // Inward movement
    // -----------------------------------------------------------------------

    if (INWARD_MOVEMENTS.includes(movement_type)) {
      if (!destination) {
        throw new Error("Destination location is required.");
      }

      await insertEntry(destination, movement_type, 1);
      return;
    }

    // -----------------------------------------------------------------------
    // Outward movement
    // -----------------------------------------------------------------------

    if (OUTWARD_MOVEMENTS.includes(movement_type)) {
      if (!source) {
        throw new Error("Source location is required.");
      }

      await checkAvailableStock(source);

      await insertEntry(source, movement_type, -1);
      return;
    }
  });
}

// ---------------------------------------------------------------------------
// Method registration
// ---------------------------------------------------------------------------

export function registerStockLedgerMethods(registry: MethodRegistry): void {
  registry.register(
    "stock.get_lot_balance",
    async (ctx) => {
      const app = await getNodra();
      const lotName = String(ctx.args.lot ?? "");

      if (!lotName) {
        throw new Error("Lot is required.");
      }

      return getLotStockBalance(app.orm, lotName);
    },
    { requireAuth: true },
  );

  registry.register(
    "stock.post_movement",
    async (ctx) => {
      const app = await getNodra();
      const movement = ctx.args.movement as StockMovement;

      await moveStock(app.orm, movement);

      return { success: true };
    },
    { requireAuth: true },
  );
}
