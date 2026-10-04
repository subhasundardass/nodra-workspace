import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  CreditCard,
  Landmark,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function DashboardPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your microfinance operations today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <CalendarClock className="mr-2 size-4" />
            Today
          </Button>

          <Button size="sm">
            <Plus className="mr-2 size-4" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Collection"
          value="₹2,84,500"
          change="+12.5%"
          description="vs. yesterday"
          icon={Banknote}
          trend="up"
        />

        <StatCard
          title="Outstanding Loans"
          value="₹48.62 L"
          change="+4.2%"
          description="from last month"
          icon={Wallet}
          trend="up"
        />

        <StatCard
          title="Active Loans"
          value="1,284"
          change="+8.1%"
          description="this month"
          icon={CreditCard}
          trend="up"
        />

        <StatCard
          title="Overdue Installments"
          value="87"
          change="-6.4%"
          description="from last week"
          icon={CircleAlert}
          trend="down"
          danger
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Collection Performance */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Collection Performance</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Today's repayment collection
              </p>
            </div>

            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold tracking-tight">
                  ₹2,84,500
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  collected of ₹3,42,000 expected
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-semibold">83.2%</div>
                <p className="text-xs text-muted-foreground">collection rate</p>
              </div>
            </div>

            <Progress value={83.2} className="mt-6 h-2" />

            <div className="mt-6 grid grid-cols-3 divide-x">
              <Metric label="Collected" value="₹2.84 L" icon={ArrowUpRight} />

              <Metric label="Pending" value="₹57.5 K" icon={CalendarClock} />

              <Metric label="Overdue" value="₹18.2 K" icon={CircleAlert} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Common operations</p>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-3">
            <QuickAction icon={ReceiptText} title="Collect Payment" />

            <QuickAction icon={Users} title="New Member" />

            <QuickAction icon={ClipboardList} title="Loan Application" />

            <QuickAction icon={Banknote} title="Disbursement" />
          </CardContent>
        </Card>
      </div>

      {/* Operational Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Branches */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Collection performance by branch
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            <BranchRow
              name="Siliguri Branch"
              amount="₹94,500"
              percentage={92}
            />

            <BranchRow
              name="Jalpaiguri Branch"
              amount="₹72,800"
              percentage={86}
            />

            <BranchRow
              name="Dhupguri Branch"
              amount="₹61,200"
              percentage={78}
            />

            <BranchRow
              name="Islampur Branch"
              amount="₹56,000"
              percentage={71}
            />

            <Button variant="outline" className="w-full">
              View All Branches
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest account activity
              </p>
            </div>

            <Button variant="ghost" size="sm">
              View all
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <Transaction
              name="Rahim Mondal"
              type="Loan Collection"
              amount="+₹2,500"
              time="5 min ago"
            />

            <Separator />

            <Transaction
              name="Maya Das"
              type="Loan Collection"
              amount="+₹1,800"
              time="12 min ago"
            />

            <Separator />

            <Transaction
              name="Sujit Roy"
              type="Loan Disbursement"
              amount="-₹50,000"
              time="24 min ago"
              negative
            />

            <Separator />

            <Transaction
              name="Anita Sharma"
              type="Loan Collection"
              amount="+₹3,200"
              time="38 min ago"
            />
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Attention Required</CardTitle>
            <p className="text-sm text-muted-foreground">
              Items that need your attention
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            <AlertItem
              title="87 overdue installments"
              description="Across 6 branches"
              variant="danger"
            />

            <AlertItem
              title="12 loan applications"
              description="Waiting for approval"
              variant="warning"
            />

            <AlertItem
              title="5 pending disbursements"
              description="Approved loans"
              variant="info"
            />

            <AlertItem
              title="3 field officers"
              description="Have not synced today"
              variant="warning"
            />

            <Button variant="outline" className="mt-2 w-full">
              View All Alerts
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current lending portfolio overview
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryItem icon={Users} label="Members" value="4,826" />

            <SummaryItem icon={Users} label="Groups" value="684" />

            <SummaryItem icon={CreditCard} label="Active Loans" value="1,284" />

            <SummaryItem icon={Landmark} label="Disbursed" value="₹72.4 L" />

            <SummaryItem icon={Wallet} label="Outstanding" value="₹48.62 L" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  trend,
  danger,
}: {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: "up" | "down";
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <div
            className={[
              "flex size-9 items-center justify-center rounded-lg",
              danger
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            ].join(" ")}
          >
            <Icon className="size-4" />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-2xl font-bold tracking-tight">{value}</div>

          <div className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={
                danger
                  ? "text-emerald-600"
                  : trend === "up"
                    ? "text-emerald-600"
                    : "text-destructive"
              }
            >
              {change}
            </span>

            <span className="text-muted-foreground">{description}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 px-4 first:pl-0 last:pr-0">
      <Icon className="size-4 text-muted-foreground" />

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-semibold">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <Button variant="outline" className="h-auto justify-start gap-3 px-4 py-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>

      <span className="text-sm">{title}</span>
    </Button>
  );
}

function BranchRow({
  name,
  amount,
  percentage,
}: {
  name: string;
  amount: string;
  percentage: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>

        <span className="text-muted-foreground">{amount}</span>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percentage} className="h-1.5" />

        <span className="w-9 text-right text-xs text-muted-foreground">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function Transaction({
  name,
  type,
  amount,
  time,
  negative,
}: {
  name: string;
  type: string;
  amount: string;
  time: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <ReceiptText className="size-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{type}</p>
      </div>

      <div className="text-right">
        <p
          className={[
            "text-sm font-semibold",
            negative ? "text-foreground" : "text-emerald-600",
          ].join(" ")}
        >
          {amount}
        </p>

        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function AlertItem({
  title,
  description,
  variant,
}: {
  title: string;
  description: string;
  variant: "danger" | "warning" | "info";
}) {
  const styles = {
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-amber-500/10 text-amber-600",
    info: "bg-primary/10 text-primary",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${styles[variant]}`}
      >
        <CircleAlert className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
