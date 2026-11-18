import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Search } from "lucide-react";

import { callMethod } from "@/lib/call-method";
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
  return {
    locationType: item.location.location_type,
    location: item.location.factory ?? item.location.warehouse ?? "Unknown",

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

  const [locationType, setLocationType] = useState<"All" | LocationType>("All");

  const [selectedLocation, setSelectedLocation] = useState("All");

  const [search, setSearch] = useState("");
  const [dateError, setDateError] = useState("");

  // ---------------------------------------------------------------------------
  // Stock Query
  // ---------------------------------------------------------------------------

  const {
    data: balances = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stock", "location-balance", fromDate, toDate],
    queryFn: async () => {
      const result = await callMethod<LocationBalanceResponse[]>(
        "stock.get_location_balance",
        {
          from_date: fromDate,
          to_date: toDate,
        },
      );

      return result.map(mapLocationBalance);
    },
  });

  // ---------------------------------------------------------------------------
  // Location Options
  // ----------------------------------------------------------------------------

  const locationOptions = useMemo(() => {
    return [
      ...new Set(
        balances
          .filter((row) => row.locationType === locationType)
          .map((row) => row.location),
      ),
    ].sort();
  }, [balances, locationType]);

  // ---------------------------------------------------------------------------
  // Filtered Stock
  // ----------------------------------------------------------------------------

  const filteredBalances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return balances.filter((row) => {
      const matchesType =
        locationType === "All" || row.locationType === locationType;

      const matchesLocation =
        selectedLocation === "All" || row.location === selectedLocation;

      const matchesSearch =
        !query ||
        row.location.toLowerCase().includes(query) ||
        row.locationType.toLowerCase().includes(query);

      return matchesType && matchesLocation && matchesSearch;
    });
  }, [balances, locationType, selectedLocation, search]);

  // ---------------------------------------------------------------------------
  // Totals
  // ----------------------------------------------------------------------------

  const totals = useMemo(
    () => ({
      openingBags: sumBy(filteredBalances, (r) => r.openingBags),
      openingQuantity: sumBy(filteredBalances, (r) => r.openingQuantity),

      stockInBags: sumBy(filteredBalances, (r) => r.stockInBags),
      stockInQuantity: sumBy(filteredBalances, (r) => r.stockInQuantity),

      stockOutBags: sumBy(filteredBalances, (r) => r.stockOutBags),
      stockOutQuantity: sumBy(filteredBalances, (r) => r.stockOutQuantity),

      closingBags: sumBy(filteredBalances, (r) => r.closingBags),
      closingQuantity: sumBy(filteredBalances, (r) => r.closingQuantity),
    }),
    [filteredBalances],
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ----------------------------------------------------------------------------

  const resetFilters = () => {
    setFromDate(firstDayOfMonth);
    setToDate(today);
    setLocationType("All");
    setSelectedLocation("All");
    setSearch("");
    setDateError("");
  };

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
    refetch();
  };

  const handleLocationTypeChange = (value: string) => {
    setLocationType(value as "All" | LocationType);
    setSelectedLocation("All");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------------

  return (
    <main className="w-full space-y-4 p-3 md:p-5">
      {/* Header */}

      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Stock by Location
        </h1>
        <p className="text-sm text-gray-500">
          View opening, inward, outward and closing stock.
        </p>
      </div>

      {/* Filters */}

      <section className="w-full rounded-lg border bg-white p-4">
        <div className="flex w-full items-end gap-4">
          {/* From Date */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label className="whitespace-nowrap text-sm font-medium">
              From Date :
            </label>
            <div className="min-w-0 flex-1">
              <DatePicker
                value={fromDate ? new Date(`${fromDate}T12:00:00`) : undefined}
                format="dd/MM/yyyy"
                placeholder="DD/MM/YYYY"
                maxDate={toDate ? new Date(`${toDate}T12:00:00`) : undefined}
                onChange={(date) =>
                  setFromDate(
                    date
                      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                      : "",
                  )
                }
              />
            </div>
          </div>

          {/* To Date */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label className="whitespace-nowrap text-sm font-medium">
              To Date :
            </label>
            <div className="min-w-0 flex-1">
              <DatePicker
                value={toDate ? new Date(`${toDate}T12:00:00`) : undefined}
                format="dd/MM/yyyy"
                placeholder="DD/MM/YYYY"
                minDate={
                  fromDate ? new Date(`${fromDate}T12:00:00`) : undefined
                }
                onChange={(date) =>
                  setToDate(
                    date
                      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                      : "",
                  )
                }
              />
            </div>
          </div>

          {/* Location Type */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label className="whitespace-nowrap text-sm font-medium">
              Location :
            </label>
            <Select
              value={locationType}
              onValueChange={handleLocationTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                <SelectItem value="Factory">Factory</SelectItem>
                <SelectItem value="Warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Factory / Warehouse */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label className="whitespace-nowrap text-sm font-medium">
              {locationType === "Warehouse" ? "Warehouse :" : "Factory :"}
            </label>
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
              disabled={locationType === "All"}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    locationType === "All"
                      ? "Select Location Type First"
                      : `Select ${locationType}`
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">
                  All{" "}
                  {locationType === "Warehouse" ? "Warehouses" : "Factories"}
                </SelectItem>
                {locationOptions.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" onClick={applyFilters}>
              <Search className="mr-2 h-4 w-4" />
              Apply
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {dateError && <p className="mt-2 text-sm text-red-600">{dateError}</p>}
      </section>

      {/* Stock Table */}

      <section className="overflow-hidden rounded-lg border bg-white">
        {/* Table Header */}

        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Stock Summary</h2>
            <p className="text-xs text-gray-500">
              {filteredBalances.length} location(s) found
            </p>
          </div>

          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search location..."
              className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200 sm:w-56"
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isPending}
              title="Refresh"
            >
              <RotateCcw
                className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="border-b text-left">
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-right">Opening</th>
                <th className="px-4 py-3 text-right">Stock In</th>
                <th className="px-4 py-3 text-right">Stock Out</th>
                <th className="px-4 py-3 text-right">Closing</th>
              </tr>
            </thead>

            <tbody>
              {isPending && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    Loading stock...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-red-600">
                    {error instanceof Error
                      ? error.message
                      : "Failed to load stock."}
                  </td>
                </tr>
              )}

              {!isPending &&
                !isError &&
                filteredBalances.map((row) => (
                  <tr
                    key={`${row.locationType}-${row.location}`}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {row.location}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.locationType}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {numberFormat.format(row.openingBags)} bags
                      <div className="text-xs text-gray-500">
                        {quantityFormat.format(row.openingQuantity)} kg
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right text-green-700">
                      +{numberFormat.format(row.stockInBags)} bags
                      <div className="text-xs text-gray-500">
                        {quantityFormat.format(row.stockInQuantity)} kg
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right text-orange-700">
                      −{numberFormat.format(row.stockOutBags)} bags
                      <div className="text-xs text-gray-500">
                        {quantityFormat.format(row.stockOutQuantity)} kg
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-semibold">
                      {numberFormat.format(row.closingBags)} bags
                      <div className="text-xs font-normal text-gray-500">
                        {quantityFormat.format(row.closingQuantity)} kg
                      </div>
                    </td>
                  </tr>
                ))}

              {!isPending && !isError && filteredBalances.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    No stock found.
                  </td>
                </tr>
              )}
            </tbody>

            {!isPending && !isError && filteredBalances.length > 0 && (
              <tfoot className="border-t-2 bg-gray-50 font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>

                  <td className="px-4 py-3 text-right">
                    {numberFormat.format(totals.openingBags)} bags
                    <div className="text-xs font-normal text-gray-500">
                      {quantityFormat.format(totals.openingQuantity)} kg
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {numberFormat.format(totals.stockInBags)} bags
                    <div className="text-xs font-normal text-gray-500">
                      {quantityFormat.format(totals.stockInQuantity)} kg
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {numberFormat.format(totals.stockOutBags)} bags
                    <div className="text-xs font-normal text-gray-500">
                      {quantityFormat.format(totals.stockOutQuantity)} kg
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    {numberFormat.format(totals.closingBags)} bags
                    <div className="text-xs font-normal text-gray-500">
                      {quantityFormat.format(totals.closingQuantity)} kg
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <p className="text-xs text-gray-500">
        Closing Stock = Opening Stock + Stock In − Stock Out.
      </p>
    </main>
  );
}
