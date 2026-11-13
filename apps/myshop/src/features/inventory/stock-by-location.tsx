import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, RotateCcw, Search } from "lucide-react";

import { callMethod } from "@/lib/call-method";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type LocationType = "Factory" | "Warehouse";

type LocationBalanceResponse = {
  location: {
    location_type: LocationType;
    factory?: string;
    warehouse?: string;
  };
  opening_bags: number;
  opening_quantity: number;
  stock_in_bags: number;
  stock_in_quantity: number;
  stock_out_bags: number;
  stock_out_quantity: number;
  closing_bags: number;
  closing_quantity: number;
};

type LocationBalance = {
  locationType: LocationType;
  location: string;
  openingBags: number;
  openingQuantity: number;
  stockInBags: number;
  stockInQuantity: number;
  stockOutBags: number;
  stockOutQuantity: number;
  closingBags: number;
  closingQuantity: number;
};

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const today = new Date().toLocaleDateString("en-CA");
const firstDayOfMonth = `${today.slice(0, 7)}-01`;

const numberFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 3,
});

const quantityFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatDate(value: string) {
  if (!value) return "—";

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function mapLocationBalance(item: LocationBalanceResponse): LocationBalance {
  const location = item.location;

  return {
    locationType: location.location_type,
    location: location.factory ?? location.warehouse ?? "Unknown",

    openingBags: Number(item.opening_bags ?? 0),
    openingQuantity: Number(item.opening_quantity ?? 0),

    stockInBags: Number(item.stock_in_bags ?? 0),
    stockInQuantity: Number(item.stock_in_quantity ?? 0),

    stockOutBags: Number(item.stock_out_bags ?? 0),
    stockOutQuantity: Number(item.stock_out_quantity ?? 0),

    closingBags: Number(item.closing_bags ?? 0),
    closingQuantity: Number(item.closing_quantity ?? 0),
  };
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function StockByLocation() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(today);

  const [appliedFromDate, setAppliedFromDate] = useState(firstDayOfMonth);

  const [appliedToDate, setAppliedToDate] = useState(today);

  const [locationType, setLocationType] = useState<"All" | LocationType>("All");

  const [search, setSearch] = useState("");
  const [dateError, setDateError] = useState("");

  // ---------------------------------------------------------------------------
  // Database Query
  // ---------------------------------------------------------------------------

  const {
    data: balances = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "stock",
      "location-balance",
      appliedFromDate,
      appliedToDate,
      locationType,
    ],

    queryFn: async () => {
      const result = await callMethod<LocationBalanceResponse[]>(
        "stock.get_location_balance",
        {
          from_date: appliedFromDate,
          to_date: appliedToDate,
          location_type: locationType === "All" ? undefined : locationType,
        },
      );

      return result.map(mapLocationBalance);
    },
  });

  // ---------------------------------------------------------------------------
  // Search Filter
  // ---------------------------------------------------------------------------

  const filteredBalances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return balances.filter((row) => {
      const matchesSearch =
        !query ||
        row.location.toLowerCase().includes(query) ||
        row.locationType.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [balances, search]);

  // ---------------------------------------------------------------------------
  // Totals
  // ---------------------------------------------------------------------------

  const totals = useMemo(
    () => ({
      openingBags: sumBy(filteredBalances, (row) => row.openingBags),
      openingQuantity: sumBy(filteredBalances, (row) => row.openingQuantity),

      stockInBags: sumBy(filteredBalances, (row) => row.stockInBags),
      stockInQuantity: sumBy(filteredBalances, (row) => row.stockInQuantity),

      stockOutBags: sumBy(filteredBalances, (row) => row.stockOutBags),
      stockOutQuantity: sumBy(filteredBalances, (row) => row.stockOutQuantity),

      closingBags: sumBy(filteredBalances, (row) => row.closingBags),
      closingQuantity: sumBy(filteredBalances, (row) => row.closingQuantity),
    }),
    [filteredBalances],
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const applyFilters = () => {
    if (!fromDate || !toDate) {
      setDateError("Please select both dates.");
      return;
    }

    if (fromDate > toDate) {
      setDateError("From Date cannot be later than To Date.");
      return;
    }

    setDateError("");
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const resetFilters = () => {
    setFromDate(firstDayOfMonth);
    setToDate(today);

    setAppliedFromDate(firstDayOfMonth);
    setAppliedToDate(today);

    setLocationType("All");
    setSearch("");
    setDateError("");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="w-full min-w-0 space-y-4 p-3 md:p-4">
      {/* Page Header */}

      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Stock by Location
          </h1>

          <p className="mt-0.5 text-sm text-slate-500">
            View stock balances for each factory and warehouse.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4" />
          {formatDate(appliedFromDate)} – {formatDate(appliedToDate)}
        </div>
      </div>

      {/* Filters */}

      <section className="rounded-lg border bg-white p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* From Date */}
          <div className="w-full space-y-1 lg:w-40">
            <label
              htmlFor="from-date"
              className="text-xs font-medium text-muted-foreground"
            >
              From Date
            </label>

            <DatePicker
              id="from-date"
              value={fromDate ? new Date(`${fromDate}T12:00:00`) : undefined}
              format="dd/MM/yyyy"
              placeholder="DD/MM/YYYY"
              maxDate={toDate ? new Date(`${toDate}T12:00:00`) : undefined}
              onChange={(date) => {
                setFromDate(
                  date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                    : "",
                );
              }}
            />
          </div>

          {/* To Date */}
          <div className="w-full space-y-1 lg:w-40">
            <label
              htmlFor="to-date"
              className="text-xs font-medium text-muted-foreground"
            >
              To Date
            </label>

            <DatePicker
              id="to-date"
              value={toDate ? new Date(`${toDate}T12:00:00`) : undefined}
              format="dd/MM/yyyy"
              placeholder="DD/MM/YYYY"
              minDate={fromDate ? new Date(`${fromDate}T12:00:00`) : undefined}
              onChange={(date) => {
                setToDate(
                  date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                    : "",
                );
              }}
            />
          </div>

          {/* Location Type */}
          <div className="w-full space-y-1 lg:w-44">
            <label
              htmlFor="location-type"
              className="text-xs font-medium text-muted-foreground"
            >
              Location Type
            </label>
            <Select
              value={locationType}
              onValueChange={(value) =>
                setLocationType(value as "All" | LocationType)
              }
            >
              <SelectTrigger id="location-type" className="h-9">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                <SelectItem value="Factory">Factory</SelectItem>
                <SelectItem value="Warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:ml-auto">
            <Button
              type="button"
              size="sm"
              onClick={applyFilters}
              className="h-9 gap-2"
            >
              <Search className="h-4 w-4" />
              Apply
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetFilters}
              className="h-9 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {dateError && (
          <p className="mt-2 text-xs text-destructive">{dateError}</p>
        )}
      </section>

      {/* Location-wise Stock Table */}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Location-wise Stock
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {isPending
                ? "Loading locations..."
                : `${filteredBalances.length} locations`}
            </p>
          </div>

          <div className="flex w-full gap-2 sm:max-w-xs">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search factory or warehouse..."
                className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isPending}
              title="Refresh stock"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw
                className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500">
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3 text-right">Opening</th>
                <th className="px-3 py-3 text-right">Stock In</th>
                <th className="px-3 py-3 text-right">Stock Out</th>
                <th className="px-3 py-3 text-right">Closing</th>
              </tr>
            </thead>

            <tbody>
              {isPending && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-10 text-center text-slate-500"
                  >
                    Loading stock balances...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-10 text-center text-red-600"
                  >
                    {error instanceof Error
                      ? error.message
                      : "Failed to load stock balances."}
                  </td>
                </tr>
              )}

              {!isPending &&
                !isError &&
                filteredBalances.map((row) => (
                  <tr
                    key={`${row.locationType}-${row.location}`}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-800">
                        {row.location}
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {row.locationType}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-medium text-slate-800">
                        {numberFormat.format(row.openingBags)} bags
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {quantityFormat.format(row.openingQuantity)} kg
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-medium text-emerald-700">
                        +{numberFormat.format(row.stockInBags)} bags
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {quantityFormat.format(row.stockInQuantity)} kg
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-medium text-orange-700">
                        −{numberFormat.format(row.stockOutBags)} bags
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {quantityFormat.format(row.stockOutQuantity)} kg
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-semibold text-slate-900">
                        {numberFormat.format(row.closingBags)} bags
                      </div>

                      <div className="mt-0.5 text-xs text-slate-500">
                        {quantityFormat.format(row.closingQuantity)} kg
                      </div>
                    </td>
                  </tr>
                ))}

              {!isPending && !isError && filteredBalances.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-10 text-center text-sm text-slate-500"
                  >
                    No stock found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>

            {!isPending && !isError && filteredBalances.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td className="px-3 py-3">Total</td>

                  <td className="px-3 py-3 text-right tabular-nums">
                    {numberFormat.format(totals.openingBags)} bags
                    <div className="text-xs font-normal text-slate-500">
                      {quantityFormat.format(totals.openingQuantity)} kg
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right tabular-nums">
                    +{numberFormat.format(totals.stockInBags)} bags
                    <div className="text-xs font-normal text-slate-500">
                      {quantityFormat.format(totals.stockInQuantity)} kg
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right tabular-nums">
                    −{numberFormat.format(totals.stockOutBags)} bags
                    <div className="text-xs font-normal text-slate-500">
                      {quantityFormat.format(totals.stockOutQuantity)} kg
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right tabular-nums">
                    {numberFormat.format(totals.closingBags)} bags
                    <div className="text-xs font-normal text-slate-500">
                      {quantityFormat.format(totals.closingQuantity)} kg
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        Closing Stock = Opening Stock + Stock In − Stock Out. Transfers are
        recorded as stock out at the source and stock in at the destination.
      </p>
    </main>
  );
}
