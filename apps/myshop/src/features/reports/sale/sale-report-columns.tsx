import type { ColumnDef } from "@tanstack/react-table";

export type SaleReportRecord = {
  name: string;
  lot: string;
  lot_no: string;
  sale_date: string;
  arrival_date?: string | null;
  factory: string;
  original_brand?: string | null;
  grade?: string | null;
  bags: number;
  net_kg_per_bag: number;
  total_kgs: number;
  sale_type?: string | null;
  tf?: string | null;
  app_inv_liq?: string | null;
  rate: number;
  broker?: string | null;
  broker_name?: string | null;
  workflow_state: "Draft" | "Confirmed" | "Cancelled";
};

function formatNumber(value: unknown, decimals = 0): string {
  const number = Number(value ?? 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value: unknown): string {
  return Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: unknown): string {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-GB").format(date);
}

export function createSaleReportColumns(): ColumnDef<SaleReportRecord>[] {
  return [
    {
      accessorKey: "sale_date",
      header: "Sale Date",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-left tabular-nums">
          {formatDate(row.original.sale_date)}
        </div>
      ),
    },
    {
      accessorKey: "lot_no",
      header: "Lot No",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          {row.original.lot_no || "—"}
        </span>
      ),
    },
    {
      accessorKey: "factory",
      header: "Factory",
      enableSorting: true,
      cell: ({ row }) => row.original.factory || "—",
    },
    {
      accessorKey: "original_brand",
      header: "Brand",
      enableSorting: true,
      cell: ({ row }) => row.original.original_brand || "—",
    },
    {
      accessorKey: "grade",
      header: "Grade",
      enableSorting: true,
      cell: ({ row }) => row.original.grade || "—",
    },
    {
      accessorKey: "bags",
      header: () => <div className="text-right">Bags</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.bags)}
        </div>
      ),
    },
    {
      accessorKey: "net_kg_per_bag",
      header: () => <div className="text-right">Net KG/Bag</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.net_kg_per_bag, 2)}
        </div>
      ),
    },
    {
      accessorKey: "total_kgs",
      header: () => <div className="text-right">Total Kgs</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-semibold tabular-nums">
          {formatNumber(row.original.total_kgs, 2)}
        </div>
      ),
    },
    {
      accessorKey: "arrival_date",
      header: "Arrival Date",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.arrival_date),
    },
    {
      accessorKey: "sale_type",
      header: "Type",
      enableSorting: true,
      cell: ({ row }) => row.original.sale_type || "—",
    },
    {
      accessorKey: "app_inv_liq",
      header: "APP/INV/LIQ",
      enableSorting: true,
      cell: ({ row }) => row.original.app_inv_liq || "—",
    },
    {
      accessorKey: "tf",
      header: "T/F",
      enableSorting: true,
      cell: ({ row }) => row.original.tf || "—",
    },
    {
      accessorKey: "rate",
      header: () => <div className="text-right">Rate</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums">
          {formatCurrency(row.original.rate)}
        </div>
      ),
    },
    {
      accessorKey: "broker_name",
      header: "Broker",
      enableSorting: true,
      cell: ({ row }) => row.original.broker_name || "—",
    },
    {
      accessorKey: "workflow_state",
      header: () => <div className="text-center">Status</div>,
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original.workflow_state;

        const statusClass =
          status === "Confirmed"
            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
            : status === "Cancelled"
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";

        return (
          <div className="text-center">
            <span
              className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${statusClass}`}
            >
              {status}
            </span>
          </div>
        );
      },
    },
  ];
}
