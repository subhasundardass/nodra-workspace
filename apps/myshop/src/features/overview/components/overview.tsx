import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

const metrics = [
  {
    title: "Total Lots",
    value: "1,248",
    today: "+12 today",
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    title: "Total Customers",
    value: "186",
    today: "+3 today",
    icon: Users,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    title: "Total Orders",
    value: "384",
    today: "5 today",
    icon: ShoppingCart,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/40",
  },
  {
    title: "Total Invoiced",
    value: "₹42.8L",
    today: "₹2.45L today",
    icon: Receipt,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    title: "Customer Dues",
    value: "₹18.75L",
    today: "14 overdue invoices",
    icon: Wallet,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    title: "Cash Sales Today",
    value: "₹85,000",
    today: "6 transactions",
    icon: Banknote,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
  {
    title: "Collections Today",
    value: "₹1.25L",
    today: "Across all payment modes",
    icon: ArrowUpRight,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
  },
  {
    title: "Available Stock",
    value: "42,500 kg",
    today: "Across all warehouses",
    icon: Boxes,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
];

const workflow = [
  {
    label: "Lots awaiting confirmation",
    count: 18,
    icon: Package,
    color: "text-blue-600",
  },
  {
    label: "Testing pending",
    count: 24,
    icon: FlaskConical,
    color: "text-violet-600",
  },
  {
    label: "Valuation pending",
    count: 16,
    icon: FileText,
    color: "text-orange-600",
  },
  {
    label: "Orders awaiting dispatch",
    count: 11,
    icon: Truck,
    color: "text-amber-600",
  },
];

const channels = [
  { name: "Direct — Buyer/Broker", amount: "₹8.4L", share: 55 },
  { name: "Auction House", amount: "₹4.2L", share: 28 },
  { name: "MNC — Tata/HUL", amount: "₹2.6L", share: 17 },
];

const yearlyPerformance = [
  {
    month: "Apr",
    lotsRegistered: 42,
    dispatched: 28,
    sales: 420000,
    orders: 24,
  },
  {
    month: "May",
    lotsRegistered: 48,
    dispatched: 34,
    sales: 510000,
    orders: 29,
  },
  {
    month: "Jun",
    lotsRegistered: 45,
    dispatched: 38,
    sales: 570000,
    orders: 32,
  },
  {
    month: "Jul",
    lotsRegistered: 56,
    dispatched: 41,
    sales: 620000,
    orders: 36,
  },
  {
    month: "Aug",
    lotsRegistered: 62,
    dispatched: 46,
    sales: 710000,
    orders: 40,
  },
  {
    month: "Sep",
    lotsRegistered: 58,
    dispatched: 49,
    sales: 680000,
    orders: 43,
  },
  {
    month: "Oct",
    lotsRegistered: 67,
    dispatched: 53,
    sales: 790000,
    orders: 47,
  },
  {
    month: "Nov",
    lotsRegistered: 72,
    dispatched: 59,
    sales: 850000,
    orders: 52,
  },
  {
    month: "Dec",
    lotsRegistered: 64,
    dispatched: 56,
    sales: 820000,
    orders: 49,
  },
  {
    month: "Jan",
    lotsRegistered: 78,
    dispatched: 65,
    sales: 960000,
    orders: 58,
  },
  {
    month: "Feb",
    lotsRegistered: 74,
    dispatched: 68,
    sales: 1020000,
    orders: 61,
  },
  {
    month: "Mar",
    lotsRegistered: 86,
    dispatched: 75,
    sales: 1180000,
    orders: 69,
  },
];

const recentOrders = [
  {
    id: "ORD-00241",
    customer: "Eastern Tea Traders",
    channel: "Direct",
    amount: "₹1,24,500",
    status: "Confirmed",
  },
  {
    id: "ORD-00240",
    customer: "ABC Tea Brokers",
    channel: "Auction",
    amount: "₹86,000",
    status: "Pending",
  },
  {
    id: "ORD-00239",
    customer: "Premium Beverages",
    channel: "MNC",
    amount: "₹2,15,000",
    status: "Confirmed",
  },
  {
    id: "ORD-00238",
    customer: "North Bengal Traders",
    channel: "Direct",
    amount: "₹64,800",
    status: "Pending",
  },
  {
    id: "ORD-00241",
    customer: "Eastern Tea Traders",
    channel: "Direct",
    amount: "₹1,24,500",
    status: "Confirmed",
  },
  {
    id: "ORD-00240",
    customer: "ABC Tea Brokers",
    channel: "Auction",
    amount: "₹86,000",
    status: "Pending",
  },
  {
    id: "ORD-00239",
    customer: "Premium Beverages",
    channel: "MNC",
    amount: "₹2,15,000",
    status: "Confirmed",
  },
];

type DashboardPeriod = "week" | "month" | "quarter" | "year" | "all";

const periodOptions: { label: string; value: DashboardPeriod }[] = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" },
];

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
  const Icon = metric.icon;

  return (
    <Card className="gap-2 rounded-md py-3 shadow-none transition-colors hover:border-primary/30">
      <CardContent className="flex items-center gap-3 px-3">
        <div className={`rounded-sm p-2 ${metric.bg}`}>
          <Icon className={`size-5 ${metric.color}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">
            {metric.title}
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
            {metric.value}
          </p>
        </div>

        <p className="max-w-24 text-right text-xs text-muted-foreground">
          {metric.today}
        </p>
      </CardContent>
    </Card>
  );
}
export default function TeaDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back 👋</h1>
          <p className="text-sm text-muted-foreground">
            Here is what is happening across your tea business.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center rounded-md border bg-muted/40 p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-sm px-3 py-1.5 text-sm transition-colors ${
                  period === option.value
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button>
            <Plus className="mr-2 size-4" />
            Quick Create
          </Button>
        </div>
      </div>

      {/* Core business metrics */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} metric={metric} />
          ))}
        </div>
      </section>

      {/* Operations */}
      <section className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        {/* Operations Overview */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-3">
            <SectionHeading
              title="Operations Overview"
              description="Tea workflow status"
            />
          </div>

          <Card className="flex-1 rounded-md py-0 shadow-none">
            <div className="divide-y">
              {[
                {
                  label: "Pending Testing",
                  count: 24,
                  icon: FlaskConical,
                  color: "text-violet-600",
                  bg: "bg-violet-50 dark:bg-violet-950/40",
                  description: "Awaiting testing",
                },
                {
                  label: "Pending Valuation",
                  count: 16,
                  icon: FileText,
                  color: "text-orange-600",
                  bg: "bg-orange-50 dark:bg-orange-950/40",
                  description: "Awaiting final rate",
                },
                {
                  label: "Pending Dispatch",
                  count: 11,
                  icon: Truck,
                  color: "text-amber-600",
                  bg: "bg-amber-50 dark:bg-amber-950/40",
                  description: "Orders to dispatch",
                },
                {
                  label: "Dispatched Today",
                  count: 7,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-950/40",
                  description: "Completed dispatches",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-3 py-3.5"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md ${item.bg}`}
                    >
                      <Icon className={`size-4 ${item.color}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.label}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    <span className="text-lg font-semibold tabular-nums">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Pending Actions */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-3">
            <SectionHeading
              title="Pending Actions"
              description="Items needing attention"
            />
          </div>

          <Card className="flex-1 rounded-md py-2 shadow-none">
            <CardContent className="space-y-1 px-2">
              {workflow.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-3.5 text-left transition-colors hover:bg-muted"
                  >
                    <Icon className={`size-4 shrink-0 ${item.color}`} />

                    <span className="min-w-0 flex-1 text-sm">{item.label}</span>

                    <Badge
                      variant="secondary"
                      className="shrink-0 rounded-sm tabular-nums"
                    >
                      {item.count}
                    </Badge>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sales by Channel */}
        <div className="flex min-w-0 flex-col">
          <div className="mb-3">
            <SectionHeading
              title="Sales by Channel"
              description="Distribution performance"
            />
          </div>

          <Card className="flex-1 rounded-md shadow-none">
            <CardContent className="space-y-6 px-4 py-4">
              {channels.map((channel) => (
                <div key={channel.name} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-sm font-medium">
                      {channel.name}
                    </span>

                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {channel.amount}
                    </span>
                  </div>

                  <Progress value={channel.share} className="h-1.5" />

                  <p className="text-xs text-muted-foreground">
                    {channel.share}% of illustrative channel sales
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Charts */}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-7">
        {/* Financial Year Performance */}
        <Card className="gap-4 rounded-md py-4 shadow-none xl:col-span-4">
          <CardHeader className="px-4">
            <CardTitle className="text-base">Business Performance</CardTitle>
            <CardDescription>
              April – March · Financial year overview
            </CardDescription>
          </CardHeader>

          <CardContent className="px-2 sm:px-4">
            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 px-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-600" />
                Lots Registered
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-600" />
                Dispatched
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-600" />
                Orders
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500" />
                Sales
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={yearlyPerformance}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border"
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickMargin={10}
                  />

                  <YAxis
                    yAxisId="count"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    width={38}
                  />

                  <YAxis
                    yAxisId="sales"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    width={48}
                    tickFormatter={(value) =>
                      value >= 100000
                        ? `₹${(value / 100000).toFixed(0)}L`
                        : `₹${(value / 1000).toFixed(0)}k`
                    }
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        lotsRegistered: "Lots Registered",
                        dispatched: "Dispatched",
                        orders: "Orders",
                        sales: "Sales",
                      };

                      const formatted =
                        name === "sales"
                          ? `₹${Number(value).toLocaleString("en-IN")}`
                          : Number(value).toLocaleString("en-IN");

                      return [formatted, labels[String(name)] ?? String(name)];
                    }}
                  />

                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="lotsRegistered"
                    name="lotsRegistered"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />

                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="dispatched"
                    name="dispatched"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />

                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="orders"
                    name="orders"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />

                  <Line
                    yAxisId="sales"
                    type="monotone"
                    dataKey="sales"
                    name="sales"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-2 px-2 text-xs text-muted-foreground">
              Illustrative data · Counts on the left axis, sales value on the
              right.
            </p>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="gap-3 rounded-md py-4 shadow-none xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between px-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <CardDescription>Latest distribution activity</CardDescription>
            </div>

            <Button variant="outline" size="sm">
              View All
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </CardHeader>

          <CardContent className="overflow-x-auto px-4">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-3 font-medium">Order</th>
                  <th className="pb-3 pr-3 font-medium">Customer</th>
                  <th className="pb-3 pr-3 font-medium">Channel</th>
                  <th className="pb-3 pr-3 text-right font-medium">Amount</th>
                  <th className="pb-3 pl-3 text-right font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 pr-3 font-medium">{order.id}</td>
                    <td className="py-3 pr-3">{order.customer}</td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {order.channel}
                    </td>
                    <td className="py-3 pr-3 text-right font-medium tabular-nums">
                      {order.amount}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <Badge
                        variant={
                          order.status === "Confirmed" ? "default" : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Footer note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="size-3.5" />
        Dashboard preview · Connect your Nodra methods to display live data.
      </div>
    </div>
  );
}
