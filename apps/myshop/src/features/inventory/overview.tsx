import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Factory,
  Info,
  Leaf,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  Warehouse,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SummaryColor = "blue" | "green" | "orange" | "purple";

const stockSummary: {
  title: string;
  bags: string;
  quantity: string;
  description: string;
  icon: LucideIcon;
  color: SummaryColor;
}[] = [
  {
    title: "Physical Stock",
    bags: "12,450",
    quantity: "124,500 kg",
    description: "Currently held at locations",
    icon: Leaf,
    color: "blue",
  },
  {
    title: "Available for Sale",
    bags: "8,200",
    quantity: "82,000 kg",
    description: "Not committed to sales",
    icon: CheckCircle2,
    color: "green",
  },
  {
    title: "Pending Dispatch",
    bags: "4,250",
    quantity: "42,500 kg",
    description: "Sold, awaiting dispatch",
    icon: Package,
    color: "orange",
  },
  {
    title: "Dispatched",
    bags: "18,500",
    quantity: "185,000 kg",
    description: "Already dispatched to buyers",
    icon: Truck,
    color: "purple",
  },
];

const summaryStyles: Record<
  SummaryColor,
  { card: string; icon: string; iconBg: string }
> = {
  blue: {
    card: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  green: {
    card: "border-emerald-200",
    icon: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  orange: {
    card: "border-orange-200",
    icon: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  purple: {
    card: "border-violet-200",
    icon: "text-violet-600",
    iconBg: "bg-violet-50",
  },
};

const locations = [
  {
    name: "Factory A",
    bags: "4,500",
    quantity: "45,000",
    percentage: 36,
    type: "factory",
  },
  {
    name: "Factory B",
    bags: "3,200",
    quantity: "32,000",
    percentage: 26,
    type: "factory",
  },
  {
    name: "Factory C",
    bags: "2,750",
    quantity: "27,500",
    percentage: 22,
    type: "factory",
  },
  {
    name: "Main Warehouse",
    bags: "2,000",
    quantity: "20,000",
    percentage: 16,
    type: "warehouse",
  },
];

const movements = [
  {
    date: "10/11/2026",
    lot: "LF2611001",
    type: "Transfer",
    from: "Factory A",
    to: "Warehouse",
    bags: 100,
    quantity: 12500,
    reference: "ST26110001",
  },
  {
    date: "10/11/2026",
    lot: "LF2611002",
    type: "Dispatch",
    from: "Factory B",
    to: "Buyer",
    bags: 50,
    quantity: 6250,
    reference: "DP26110001",
  },
  {
    date: "09/11/2026",
    lot: "LF2611003",
    type: "Lot Receipt",
    from: "—",
    to: "Factory A",
    bags: 300,
    quantity: 37500,
    reference: "LF2611003",
  },
  {
    date: "08/11/2026",
    lot: "LF2611004",
    type: "Return",
    from: "Buyer",
    to: "Warehouse",
    bags: 25,
    quantity: 3125,
    reference: "RT26110001",
  },
];

const movementStyles: Record<string, string> = {
  Transfer: "bg-blue-50 text-blue-700",
  Dispatch: "bg-orange-50 text-orange-700",
  "Lot Receipt": "bg-emerald-50 text-emerald-700",
  Return: "bg-violet-50 text-violet-700",
};

function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: LucideIcon;
  action?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {action && (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {action}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function SummaryCard({ item }: { item: (typeof stockSummary)[number] }) {
  const Icon = item.icon;
  const style = summaryStyles[item.color];

  return (
    <div className={`min-w-0 rounded-lg border bg-white px-3 py-3`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`rounded-md p-2 ${style.iconBg}`}>
            <Icon className={`h-4 w-4 ${style.icon}`} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-md font-bold ">{item.title}</p>
            <p className="mt-0 text-xs  text-slate-400">{item.description}</p>
          </div>
        </div>
        <Info className="h-3.5 w-3.5 shrink-0 text-slate-300" />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-2xl font-semibold tracking-tight text-slate-900">
          {item.bags}
        </span>
        <span className="text-sm text-slate-500">Bags</span>
        <span className="ml-auto text-sm font-medium text-slate-500">
          {item.quantity}
        </span>
      </div>
    </div>
  );
}

function LocationStock() {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <SectionHeader
        title="Location-wise Stock"
        icon={MapPin}
        action="View All"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50 text-left  text-slate-500">
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 text-right font-medium">Bags</th>
              <th className="px-3 py-2 text-right font-medium">
                Quantity (kg)
              </th>
              <th className="px-3 py-2 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => {
              const Icon = location.type === "factory" ? Factory : Warehouse;
              return (
                <tr
                  key={location.name}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-2.5 font-medium text-slate-700">
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      {location.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                    {location.bags}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {location.quantity}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-slate-500">
                        {location.percentage}%
                      </span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${location.percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold text-slate-800">
              <td className="px-3 py-2.5">Total</td>
              <td className="px-3 py-2.5 text-right tabular-nums">12,450</td>
              <td className="px-3 py-2.5 text-right tabular-nums">124,500</td>
              <td className="px-3 py-2.5">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function StockDistribution() {
  const segments = [
    { name: "Factory A", percentage: 36, color: "bg-blue-500" },
    { name: "Factory B", percentage: 26, color: "bg-emerald-500" },
    { name: "Factory C", percentage: 22, color: "bg-orange-400" },
    { name: "Warehouse", percentage: 16, color: "bg-violet-500" },
  ];

  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <SectionHeader title="Stock Distribution" icon={Package} />
      <div className="flex flex-wrap items-center justify-center gap-5 py-2">
        <div
          className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
          style={{
            background:
              "conic-gradient(#3b82f6 0% 36%, #10b981 36% 62%, #fb923c 62% 84%, #8b5cf6 84% 100%)",
          }}
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-xl font-semibold tabular-nums text-slate-900">
              12,450
            </span>
            <span className=" text-slate-500 text-sm">Total bags</span>
          </div>
        </div>
        <div className="grid gap-3">
          {segments.map((segment) => (
            <div
              key={segment.name}
              className="flex min-w-32 items-center justify-between gap-4"
            >
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <span className={`h-2.5 w-2.5 rounded-full ${segment.color}`} />
                {segment.name}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-800">
                {segment.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentMovements() {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <SectionHeader
        title="Recent Stock Movements"
        icon={Clock3}
        action="View All"
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50 text-left text-slate-500">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Lot No.</th>
              <th className="px-3 py-2 font-medium">Movement</th>
              <th className="px-3 py-2 font-medium">From → To</th>
              <th className="px-3 py-2 text-right font-medium">Bags</th>
              <th className="px-3 py-2 text-right font-medium">
                Quantity (Kg)
              </th>
              <th className="px-3 py-2 font-medium">Reference</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((movement, index) => (
              <tr
                key={`${movement.lot}-${movement.type}-${index}`}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                  {movement.date}
                </td>

                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-primary">
                  {movement.lot}
                </td>

                <td className="px-3 py-2.5">
                  <span
                    className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${
                      movementStyles[movement.type] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {movement.type}
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                  {movement.from || "—"} → {movement.to || "—"}
                </td>

                <td className="px-3 py-2.5 text-right font-medium tabular-nums text-slate-800">
                  {Number(movement.bags ?? 0).toLocaleString("en-IN")}
                </td>

                <td className="px-3 py-2.5 text-right font-medium tabular-nums text-slate-800">
                  {Number(movement.quantity ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}
                </td>

                <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                  {"—"}
                </td>
              </tr>
            ))}

            {movements.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No recent stock movements found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StockOverview() {
  return (
    <div className="w-full min-w-0 space-y-3 p-3 md:p-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Stock Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Current stock position across factories and warehouses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-foreground"
          >
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            As on: 10/11/2026
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-foreground"
          >
            All Factories
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-foreground"
          >
            All Warehouses
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            title="Refresh"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stockSummary.map((item) => (
          <SummaryCard key={item.title} item={item} />
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <LocationStock />
        <StockDistribution />
      </div>

      <RecentMovements />

      <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
          <p className="text-sm leading-5 text-emerald-950">
            <strong>Physical stock</strong> is tea currently held at your
            locations.
            <strong> Available for sale</strong> is physical stock minus
            confirmed sales awaiting dispatch.
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium text-emerald-800">
          12,450 physical − 4,250 pending = 8,200 available
        </p>
      </div>
    </div>
  );
}
