import type { ColumnDef } from "@tanstack/react-table";

export type LotReportRecord = {
  name: string;
  lot_no: string;
  // entry_date: string;
  arrival_date?: string | null;
  factory: string;
  original_brand?: string | null;
  grade?: string | null;
  bags: number;
  net_kg_per_bag: number;
  // warehouse?: string | null;
  workflow_state: "Draft" | "Confirmed" | "Cancelled";
  total_kgs: number;
};

function formatNumber(value: unknown, decimals = 0): string {
  const number = Number(value ?? 0);

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function formatDate(value: unknown): string {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-GB").format(date);
}

export function createLotReportColumns(): ColumnDef<LotReportRecord>[] {
  return [
    {
      accessorKey: "lot_no",
      header: "Lot No",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-primary">{row.original.lot_no}</span>
      ),
    },
    // {
    //   accessorKey: "entry_date",
    //   header: "Entry Date",
    //   enableSorting: true,
    //   cell: ({ row }) => formatDate(row.original.entry_date),
    // },
    {
      accessorKey: "arrival_date",
      header: "Arrival Date",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.arrival_date),
    },
    {
      accessorKey: "factory",
      header: "Factory",
      enableSorting: true,
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
      header: "Bags",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.bags)}
        </div>
      ),
    },
    {
      accessorKey: "net_kg_per_bag",
      header: "Net KG/Bag",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.net_kg_per_bag, 2)}
        </div>
      ),
    },
    {
      accessorKey: "total_kgs",
      header: "Total Kgs",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-medium tabular-nums">
          {formatNumber(row.original.total_kgs, 2)}
        </div>
      ),
    },
    // {
    //   accessorKey: "warehouse",
    //   header: "Warehouse",
    //   enableSorting: true,
    //   cell: ({ row }) => row.original.warehouse || "—",
    // },
    {
      accessorKey: "workflow_state",
      header: "Status",
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
          <span
            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${statusClass}`}
          >
            {status}
          </span>
        );
      },
    },
  ];
}
