import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  LoaderCircle,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callMethod } from "@/lib/call-method";
import { LotSelectPopup } from "./lot-select-popup";

export type SalesOrderParty = {
  name: string;
  title?: string;
  is_buyer?: boolean | number | string;
  is_active?: boolean | number | string;
};

export type SalesOrderWarehouse = {
  name: string;
  title?: string;
  is_active?: boolean | number | string;
};

export type SalesOrderLot = {
  name: string;
  lot_no?: string;
  factory?: string;
  grade?: string;
  original_brand?: string;
  warehouse?: string;
  bags?: number | string;
  net_kg_per_bag?: number | string;
  workflow_state?: string;
  docstatus?: number | string;
};

export type SalesOrderValuation = {
  name: string;
  lot: string;
  final_grade?: string;
  final_rate?: number | string;
  workflow_state?: string;
  docstatus?: number | string;
  valuation_date?: string;
};

export type SalesOrderItemValue = {
  lot: string;
  grade: string;
  available_bags: number;
  ordered_bags: number;
  net_kg_per_bag: number;
  total_weight_kg: number;
  rate_per_kg: number;
  total_amount: number;
  lot_no: string;
  brand: string;
};

export type SalesOrderFormValues = {
  order_date: string;
  warehouse: string;
  party: string;
  sales_channel: string;
  items: SalesOrderItemValue[];
  payment_terms: string;
  delivery_date: string;
  delivery_address: string;
  remarks: string;
};

interface SalesOrderFormProps {
  parties: SalesOrderParty[];
  warehouses: SalesOrderWarehouse[];
  saving: boolean;
  onSubmit: (values: SalesOrderFormValues) => Promise<void>;
  onCancel: () => void;
}

type ListResult<T> = { documents?: T[] };

type LotOption = SalesOrderLot & {
  valuation: SalesOrderValuation;
  availableBags: number;
};

const SALES_CHANNELS = [
  "Direct Sale",
  "Auction House",
  "MNC",
  "Warehouse Sale",
  "Other",
];

function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-sm font-medium">
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </span>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function SalesOrderForm({
  parties,
  warehouses,
  saving,
  onSubmit,
  onCancel,
}: SalesOrderFormProps) {
  const [orderDate, setOrderDate] = useState(today());
  const [warehouse, setWarehouse] = useState("");
  const [party, setParty] = useState("");
  const [salesChannel, setSalesChannel] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<SalesOrderItemValue[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const [availableLots, setAvailableLots] = useState<LotOption[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [lotError, setLotError] = useState<string | null>(null);
  const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeParties = useMemo(
    () =>
      parties.filter(
        (item) => isEnabled(item.is_active) && isEnabled(item.is_buyer),
      ),
    [parties],
  );
  const activeWarehouses = useMemo(
    () =>
      warehouses.filter(
        (item) => item.is_active === undefined || isEnabled(item.is_active),
      ),
    [warehouses],
  );

  useEffect(() => {
    let cancelled = false;

    if (!warehouse) {
      setAvailableLots([]);
      setLotError(null);
      setLoadingLots(false);
      return;
    }

    async function loadEligibleLots() {
      setLoadingLots(true);
      setLotError(null);

      try {
        const [lotResult, valuationResult] = await Promise.all([
          callMethod<ListResult<SalesOrderLot>>("document.list", {
            doctype: "Lots",
            fields: [
              "name",
              "lot_no",
              "factory",
              "grade",
              "original_brand",
              "warehouse",
              "bags",
              "net_kg_per_bag",
              "workflow_state",
              "docstatus",
            ],
            filters: { warehouse, workflow_state: "Confirmed" },
            limit: 100,
            offset: 0,
          }),
          callMethod<ListResult<SalesOrderValuation>>("document.list", {
            doctype: "TeaValuation",
            fields: [
              "name",
              "lot",
              "final_grade",
              "final_rate",
              "workflow_state",
              "docstatus",
              "valuation_date",
            ],
            filters: { workflow_state: "Confirmed" },
            orderBy: "valuation_date desc",
            limit: 100,
            offset: 0,
          }),
        ]);

        if (cancelled) return;

        const confirmedValuations = (valuationResult.documents ?? []).filter(
          (valuation) =>
            valuation.workflow_state === "Confirmed" &&
            (valuation.docstatus === undefined ||
              Number(valuation.docstatus) === 51),
        );
        const valuationByLot = new Map<string, SalesOrderValuation>();

        for (const valuation of confirmedValuations) {
          if (!valuation.lot || valuationByLot.has(valuation.lot)) continue;
          valuationByLot.set(valuation.lot, valuation);
        }

        const eligible = (lotResult.documents ?? [])
          .filter(
            (lot) =>
              lot.warehouse === warehouse &&
              lot.workflow_state === "Confirmed" &&
              (lot.docstatus === undefined || Number(lot.docstatus) === 51),
          )
          .flatMap((lot) => {
            const valuation = valuationByLot.get(lot.name);
            if (!valuation) return [];

            const registeredBags = Math.max(0, Math.floor(asNumber(lot.bags)));
            if (registeredBags <= 0) return [];

            return [
              {
                ...lot,
                valuation,
                // Current UI baseline. Final available stock must be verified by the server.
                availableBags: registeredBags,
              },
            ];
          });

        setAvailableLots(eligible);
      } catch (cause) {
        if (!cancelled) {
          setAvailableLots([]);
          setLotError(
            cause instanceof Error
              ? cause.message
              : "Unable to load eligible tea lots.",
          );
        }
      } finally {
        if (!cancelled) setLoadingLots(false);
      }
    }

    void loadEligibleLots();
    return () => {
      cancelled = true;
    };
  }, [warehouse]);

  const alreadyAdded = useMemo(
    () => new Set(items.map((item) => item.lot)),
    [items],
  );
  const filteredLots = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableLots.filter((lot) => {
      if (alreadyAdded.has(lot.name)) return false;
      if (!query) return true;
      return [
        lot.name,
        lot.lot_no,
        lot.factory,
        lot.grade,
        lot.original_brand,
        lot.valuation.final_grade,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [availableLots, alreadyAdded, search]);

  const totalBags = items.reduce((sum, item) => sum + item.ordered_bags, 0);
  const totalWeight = items.reduce(
    (sum, item) => sum + item.total_weight_kg,
    0,
  );
  const totalAmount = items.reduce((sum, item) => sum + item.total_amount, 0);
  const selectedParty = activeParties.find((item) => item.name === party);
  const selectedWarehouse = activeWarehouses.find(
    (item) => item.name === warehouse,
  );

  function toggleLot(name: string, checked: boolean) {
    setSelectedLots((current) =>
      checked
        ? [...new Set([...current, name])]
        : current.filter((item) => item !== name),
    );
  }

  function addSelectedLots() {
    const additions = availableLots
      .filter(
        (lot) => selectedLots.includes(lot.name) && !alreadyAdded.has(lot.name),
      )
      .map((lot): SalesOrderItemValue => {
        const netKgPerBag = Math.max(0, asNumber(lot.net_kg_per_bag));
        const rate = Math.max(0, asNumber(lot.valuation.final_rate));
        return {
          lot: lot.name,
          lot_no: lot.lot_no || lot.name,
          brand: lot.original_brand || "—",
          grade: lot.valuation.final_grade || lot.grade || "—",
          available_bags: lot.availableBags,
          ordered_bags: 1,
          net_kg_per_bag: netKgPerBag,
          total_weight_kg: netKgPerBag,
          rate_per_kg: rate,
          total_amount: netKgPerBag * rate,
        };
      });

    setItems((current) => [...current, ...additions]);
    setSelectedLots([]);
    setSearch("");
    setPickerOpen(false);
    setFormError(null);
  }

  function updateItem(lotName: string, patch: Partial<SalesOrderItemValue>) {
    setItems((current) =>
      current.map((item) => {
        if (item.lot !== lotName) return item;
        const next = { ...item, ...patch };
        next.ordered_bags = Math.max(
          0,
          Math.floor(asNumber(next.ordered_bags)),
        );
        next.rate_per_kg = Math.max(0, asNumber(next.rate_per_kg));
        next.total_weight_kg = next.ordered_bags * next.net_kg_per_bag;
        next.total_amount = next.total_weight_kg * next.rate_per_kg;
        return next;
      }),
    );
    setFormError(null);
  }

  function removeItem(lotName: string) {
    setItems((current) => current.filter((item) => item.lot !== lotName));
  }

  async function handleSubmit() {
    setFormError(null);

    if (!orderDate || !warehouse || !party || !salesChannel) {
      setFormError(
        "Complete the order date, warehouse, buyer, and sales channel first.",
      );
      return;
    }
    if (items.length === 0) {
      setFormError("Add at least one tea lot to the order book.");
      return;
    }

    const invalidItem = items.find(
      (item) =>
        item.ordered_bags < 1 ||
        item.ordered_bags > item.available_bags ||
        item.rate_per_kg <= 0,
    );
    if (invalidItem) {
      setFormError(
        `Check quantity and rate for lot ${invalidItem.lot_no}. Bags must be within available stock and rate must be greater than zero.`,
      );
      return;
    }

    await onSubmit({
      order_date: orderDate,
      warehouse,
      party,
      sales_channel: salesChannel,
      items,
      payment_terms: paymentTerms.trim(),
      delivery_date: deliveryDate,
      delivery_address: deliveryAddress.trim(),
      remarks: remarks.trim(),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">New Sales Order</h1>
            <span className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Draft
            </span>
          </div>
          <p className="mt-0 text-sm text-muted-foreground">
            Select a buyer and warehouse, then build the order from eligible tea
            lots.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Save Draft
          </Button>
        </div>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-md border bg-card p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Order Details</h2>
                <p className="text-sm text-muted-foreground">
                  Select the sales channel, buyer and dispatch warehouse
                </p>
              </div>
              <ShoppingCart className="size-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
              {/* Order Date — narrow */}
              <label className="min-w-0 xl:col-span-2">
                <FieldLabel required>Order Date</FieldLabel>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(event) => setOrderDate(event.target.value)}
                />
              </label>

              {/* Sales Channel — narrow */}
              <label className="min-w-0 xl:col-span-2">
                <FieldLabel required>Sales Channel</FieldLabel>
                <select
                  value={salesChannel}
                  onChange={(event) => {
                    setSalesChannel(event.target.value);
                    setParty("");
                    setItems([]);
                    setSelectedLots([]);
                  }}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select channel</option>
                  {SALES_CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </label>

              {/* Buyer / Party — wider */}
              <label className="min-w-0 xl:col-span-4">
                <FieldLabel required>Buyer / Party</FieldLabel>
                <select
                  value={party}
                  onChange={(event) => {
                    setParty(event.target.value);
                    setItems([]);
                    setSelectedLots([]);
                  }}
                  disabled={!salesChannel}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {!salesChannel
                      ? "Select a sales channel first"
                      : salesChannel === "MNC"
                        ? "Select MNC company"
                        : "Select buyer / party"}
                  </option>

                  {activeParties
                    .filter((item) => {
                      // if (salesChannel === "MNC") {
                      //   return (
                      //     item.is_buyer && /mnc/i.test(item.party_type || "")
                      //   );
                      // }

                      // if (salesChannel === "Direct") {
                      //   return item.is_buyer || item.is_agent;
                      // }

                      // if (salesChannel === "Auction House") {
                      //   return item.is_buyer || item.is_agent;
                      // }

                      return item.is_buyer;
                    })
                    .map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.title || item.name}
                      </option>
                    ))}
                </select>
              </label>

              {/* Warehouse — wider */}
              <label className="min-w-0 xl:col-span-4">
                <FieldLabel required>Warehouse</FieldLabel>
                <select
                  value={warehouse}
                  onChange={(event) => {
                    setWarehouse(event.target.value);
                    setItems([]);
                    setSelectedLots([]);
                  }}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select warehouse</option>
                  {activeWarehouses.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.title || item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-md border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-5">
              <div>
                <h2 className="font-semibold">Order Book</h2>
                <p className="mt-0 text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "lot" : "lots"} added ·
                  edit bags and rate in the table
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedLots([]);
                  setPickerOpen(true);
                }}
                // disabled={
                //   !warehouse ||
                //   loadingLots ||
                //   availableLots.every((lot) => alreadyAdded.has(lot.name))
                // }
              >
                <Plus className="size-4" /> Add Lots
              </Button>
            </div>

            {!warehouse ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <PackageSearch className="size-9 text-muted-foreground/70" />
                <p className="font-medium">Select a warehouse first</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  The lot picker will show only confirmed, valued lots
                  registered in the selected warehouse.
                </p>
              </div>
            ) : loadingLots ? (
              <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" /> Loading
                eligible lots...
              </div>
            ) : lotError ? (
              <div className="flex items-start gap-2 px-5 py-8 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {lotError}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <div className="rounded-xl bg-muted p-3">
                  <ShoppingCart className="size-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No lots in this order</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add one or more eligible lots. You can set the quantity and
                  agreed rate directly in the order table.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerOpen(true)}
                  disabled={availableLots.length === 0}
                >
                  <Plus className="size-4" /> Add your first lot
                </Button>
                {availableLots.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No confirmed lots with a confirmed valuation were found for
                    this warehouse.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Lot / Grade</th>
                      <th className="px-3 py-3 text-right font-medium">
                        Available
                      </th>
                      <th className="w-28 px-3 py-3 font-medium">Bags</th>
                      <th className="w-36 px-3 py-3 font-medium">Rate / KG</th>
                      <th className="px-3 py-3 text-right font-medium">
                        Weight
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Amount
                      </th>
                      <th className="w-10 px-2 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item) => (
                      <tr
                        key={item.lot}
                        className="align-middle hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.lot_no}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {item.brand} · Grade {item.grade}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {item.lot}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {item.available_bags}
                        </td>
                        <td className="px-3 py-3">
                          <Input
                            aria-label={`Bags for ${item.lot_no}`}
                            type="number"
                            min={1}
                            max={item.available_bags}
                            step={1}
                            value={String(item.ordered_bags)}
                            onChange={(event) =>
                              updateItem(item.lot, {
                                ordered_bags: asNumber(event.target.value),
                              })
                            }
                            className="h-8 min-w-20 text-right tabular-nums"
                          />
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            {item.net_kg_per_bag} kg/bag
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Input
                            aria-label={`Rate per kg for ${item.lot_no}`}
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={String(item.rate_per_kg)}
                            onChange={(event) =>
                              updateItem(item.lot, {
                                rate_per_kg: asNumber(event.target.value),
                              })
                            }
                            className="h-8 min-w-28 text-right tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {item.total_weight_kg.toLocaleString("en-IN", {
                            maximumFractionDigits: 3,
                          })}{" "}
                          kg
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {money(item.total_amount)}
                        </td>
                        <td className="px-2 py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${item.lot_no}`}
                            onClick={() => removeItem(item.lot)}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-md border bg-card">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
              aria-expanded={additionalDetailsOpen}
              onClick={() => setAdditionalDetailsOpen((open) => !open)}
            >
              <span>
                <span className="block font-semibold">Additional Details</span>
                <span className="mt-0 block text-sm text-muted-foreground">
                  Payment terms, delivery details, and remarks
                </span>
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${additionalDetailsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {additionalDetailsOpen && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t p-5 sm:grid-cols-2 md:p-6 lg:gap-x-8">
                <label className="min-w-0">
                  <FieldLabel>Payment Terms</FieldLabel>
                  <Input
                    value={paymentTerms}
                    onChange={(event) => setPaymentTerms(event.target.value)}
                    placeholder="e.g. Advance, 30 days"
                    className="mt-1.5 h-10 w-full"
                  />
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    Specify the agreed payment conditions.
                  </span>
                </label>

                <label className="min-w-0">
                  <FieldLabel>Expected Delivery Date</FieldLabel>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    className="mt-1.5 h-10 w-full"
                  />
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    Planned date for dispatch or delivery.
                  </span>
                </label>

                <label className="min-w-0 sm:col-span-1">
                  <FieldLabel>Delivery Address</FieldLabel>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="Enter the delivery location, contact details, and any specific delivery instructions..."
                    className="mt-1.5 min-h-24 w-full resize-y"
                  />
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    Leave blank if the buyer's registered address will be used.
                  </span>
                </label>

                <label className="min-w-0 sm:col-span-1">
                  <FieldLabel>Remarks</FieldLabel>
                  <Textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder="Additional instructions, special handling requirements, or agreed commercial terms..."
                    className="mt-1.5 min-h-24 w-full resize-y"
                  />
                </label>
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-4">
          <section className="rounded-md border bg-card p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Order Summary</h2>
              <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                {items.length} items
              </span>
            </div>
            <div className="space-y-3">
              <SummaryMetric
                label="Total Lots"
                value={totalBags.toLocaleString("en-IN")}
              />
              <SummaryMetric
                label="Total bags"
                value={totalBags.toLocaleString("en-IN")}
              />
              <SummaryMetric
                label="Total weight"
                value={`${totalWeight.toLocaleString("en-IN", { maximumFractionDigits: 3 })} kg`}
              />
              <SummaryMetric
                label="Lots selected"
                value={String(items.length)}
              />
            </div>
            <div className="my-4 border-t" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Grand Total</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {money(totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Calculated from each lot's weight and rate.
              </p>
            </div>
            <div className="mt-5 space-y-2">
              <Button
                className="w-full"
                onClick={() => void handleSubmit()}
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Save as Draft
              </Button>
              <Button
                className="w-full"
                variant="outline"
                disabled
                title="Confirmation will be enabled after server-side stock validation and reservation are implemented."
              >
                Confirm Order
              </Button>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              Confirming an order must recheck current stock and apply
              buyer/channel rules on the server before reserving bags.
            </div>
          </section>
        </aside>
      </div>

      <LotSelectPopup
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        warehouseTitle={selectedWarehouse?.title}
        search={search}
        setSearch={setSearch}
        filteredLots={filteredLots}
        loadingLots={loadingLots}
        lotError={lotError}
        selectedLots={selectedLots}
        toggleLot={toggleLot}
        addSelectedLots={addSelectedLots}
      />
    </div>
  );
}
