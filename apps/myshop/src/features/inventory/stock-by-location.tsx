import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  RotateCcw,
  Search,
  Warehouse,
} from "lucide-react";

type LocationType = "Factory" | "Warehouse";
type MovementDirection = "in" | "out";

type StockMovement = {
  date: string; // YYYY-MM-DD
  lot: string;
  locationType: LocationType;
  location: string;
  direction: MovementDirection;
  bags: number;
  quantity: number;
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

const movements: StockMovement[] = [
  // Sample ledger movements. Replace with the StockLedger report response.
  {
    date: "2026-10-28",
    lot: "LF2610001",
    locationType: "Factory",
    location: "Factory A",
    direction: "in",
    bags: 500,
    quantity: 62500,
  },
  {
    date: "2026-10-30",
    lot: "LF2610002",
    locationType: "Factory",
    location: "Factory B",
    direction: "in",
    bags: 350,
    quantity: 43750,
  },
  {
    date: "2026-11-02",
    lot: "LF2610001",
    locationType: "Factory",
    location: "Factory A",
    direction: "out",
    bags: 100,
    quantity: 12500,
  },
  {
    date: "2026-11-03",
    lot: "LF2610001",
    locationType: "Warehouse",
    location: "Main Warehouse",
    direction: "in",
    bags: 100,
    quantity: 12500,
  },
  {
    date: "2026-11-04",
    lot: "LF2610002",
    locationType: "Factory",
    location: "Factory B",
    direction: "out",
    bags: 50,
    quantity: 6250,
  },
  {
    date: "2026-11-05",
    lot: "LF2610003",
    locationType: "Factory",
    location: "Factory A",
    direction: "in",
    bags: 300,
    quantity: 37500,
  },
  {
    date: "2026-11-07",
    lot: "LF2610003",
    locationType: "Factory",
    location: "Factory A",
    direction: "out",
    bags: 25,
    quantity: 3125,
  },
  {
    date: "2026-11-08",
    lot: "LF2610004",
    locationType: "Warehouse",
    location: "Main Warehouse",
    direction: "in",
    bags: 25,
    quantity: 3125,
  },
  {
    date: "2026-11-10",
    lot: "LF2610002",
    locationType: "Factory",
    location: "Factory B",
    direction: "out",
    bags: 50,
    quantity: 6250,
  },
];

const today = "2026-11-10";
const firstDayOfMonth = "2026-11-01";

const numberFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 3,
});
const quantityFormat = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function calculateLocationBalances(
  entries: StockMovement[],
  fromDate: string,
  toDate: string,
): LocationBalance[] {
  const keys = new Map<
    string,
    { locationType: LocationType; location: string }
  >();

  entries.forEach((entry) => {
    const key = `${entry.locationType}:${entry.location}`;
    keys.set(key, {
      locationType: entry.locationType,
      location: entry.location,
    });
  });

  return Array.from(keys.entries())
    .map(([key, locationInfo]) => {
      const locationEntries = entries.filter(
        (entry) => `${entry.locationType}:${entry.location}` === key,
      );
      const beforePeriod = locationEntries.filter(
        (entry) => entry.date < fromDate,
      );
      const inPeriod = locationEntries.filter(
        (entry) => entry.date >= fromDate && entry.date <= toDate,
      );

      const openingBags = sumBy(beforePeriod, (entry) =>
        entry.direction === "in" ? entry.bags : -entry.bags,
      );
      const openingQuantity = sumBy(beforePeriod, (entry) =>
        entry.direction === "in" ? entry.quantity : -entry.quantity,
      );
      const stockIn = inPeriod.filter((entry) => entry.direction === "in");
      const stockOut = inPeriod.filter((entry) => entry.direction === "out");
      const stockInBags = sumBy(stockIn, (entry) => entry.bags);
      const stockInQuantity = sumBy(stockIn, (entry) => entry.quantity);
      const stockOutBags = sumBy(stockOut, (entry) => entry.bags);
      const stockOutQuantity = sumBy(stockOut, (entry) => entry.quantity);

      return {
        ...locationInfo,
        openingBags,
        openingQuantity,
        stockInBags,
        stockInQuantity,
        stockOutBags,
        stockOutQuantity,
        closingBags: openingBags + stockInBags - stockOutBags,
        closingQuantity: openingQuantity + stockInQuantity - stockOutQuantity,
      };
    })
    .filter(
      (row) =>
        row.openingBags !== 0 ||
        row.stockInBags !== 0 ||
        row.stockOutBags !== 0 ||
        row.closingBags !== 0,
    )
    .sort((a, b) => a.location.localeCompare(b.location));
}

function SummaryCard({
  label,
  value,
  unit,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  icon: typeof Warehouse;
  tone: "blue" | "green" | "orange" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`rounded-md p-2 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{unit}</p>
    </div>
  );
}

export default function StockByLocation() {
  const [fromDate, setFromDate] = useState(firstDayOfMonth);
  const [toDate, setToDate] = useState(today);
  const [appliedFromDate, setAppliedFromDate] = useState(firstDayOfMonth);
  const [appliedToDate, setAppliedToDate] = useState(today);
  const [locationType, setLocationType] = useState<"All" | LocationType>("All");
  const [search, setSearch] = useState("");
  const [dateError, setDateError] = useState("");

  const balances = useMemo(
    () => calculateLocationBalances(movements, appliedFromDate, appliedToDate),
    [appliedFromDate, appliedToDate],
  );

  const filteredBalances = useMemo(() => {
    const query = search.trim().toLowerCase();
    return balances.filter((row) => {
      const matchesType =
        locationType === "All" || row.locationType === locationType;
      const matchesSearch =
        !query ||
        row.location.toLowerCase().includes(query) ||
        row.locationType.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [balances, locationType, search]);

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

  return (
    <main className="w-full min-w-0 space-y-4 p-3 md:p-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Stock by Location
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            View opening, inward, outward and closing stock for each factory and
            warehouse.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4" />
          {formatDate(appliedFromDate)} – {formatDate(appliedToDate)}
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
          <div>
            <label
              htmlFor="from-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              From Date
            </label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="to-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              To Date
            </label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="location-type"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Location Type
            </label>
            <select
              id="location-type"
              value={locationType}
              onChange={(event) =>
                setLocationType(event.target.value as "All" | LocationType)
              }
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Locations</option>
              <option value="Factory">Factory</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </div>
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Search className="h-4 w-4" />
            Apply
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
        {dateError && <p className="mt-2 text-sm text-red-600">{dateError}</p>}
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Opening Stock"
          value={numberFormat.format(totals.openingBags)}
          unit={`${quantityFormat.format(totals.openingQuantity)} kg`}
          icon={Warehouse}
          tone="slate"
        />
        <SummaryCard
          label="Stock In"
          value={numberFormat.format(totals.stockInBags)}
          unit={`${quantityFormat.format(totals.stockInQuantity)} kg received`}
          icon={ArrowDownLeft}
          tone="green"
        />
        <SummaryCard
          label="Stock Out"
          value={numberFormat.format(totals.stockOutBags)}
          unit={`${quantityFormat.format(totals.stockOutQuantity)} kg moved out`}
          icon={ArrowUpRight}
          tone="orange"
        />
        <SummaryCard
          label="Closing Stock"
          value={numberFormat.format(totals.closingBags)}
          unit={`${quantityFormat.format(totals.closingQuantity)} kg as of ${formatDate(appliedToDate)}`}
          icon={MapPin}
          tone="blue"
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Location-wise Stock
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredBalances.length} locations · Quantities are based on
              posted stock ledger entries.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search factory or warehouse..."
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
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
              {filteredBalances.map((row) => (
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
              {filteredBalances.length === 0 && (
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
            {filteredBalances.length > 0 && (
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
        recorded as an outward movement at the source and an inward movement at
        the destination. This page currently uses sample data; connect it to
        StockLedger for live balances.
      </p>
    </main>
  );
}
