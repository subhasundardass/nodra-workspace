import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

export type OfferReportRecord = {
  // OfferSheet
  offer_no: string;
  offer_date: string;
  broker_type: string;
  asking_rate: number;
  remarks?: string | null;
  workflow_state: "Draft" | "Confirmed" | "Cancelled";

  // Lots
  lot_no: string;
  factory: string;
  original_brand?: string | null;
  grade?: string | null;
  bags: number;
  net_kg_per_bag: number;
  total_kgs: number;
  arrival_date?: string | null;

  // SaleBook
  sale_type?: string | null;
  tf?: string | null;

  // TeaTesting
  tested_grade?: string | null;
  sample_date?: string | null;
  appearance?: string | null;
  infusion?: string | null;
  liquor?: string | null;
  taste?: string | null;
  defects?: string | null;
  test_remarks?: string | null;
};

// function formatNumber(value: unknown, decimals = 0): string {
//   const number = Number(value ?? 0);

//   return number.toLocaleString("en-IN", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: decimals,
//   });
// }

// function formatDate(value: unknown): string {
//   if (!value) return "—";

//   const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

//   if (Number.isNaN(date.getTime())) return String(value);

//   return new Intl.DateTimeFormat("en-GB").format(date);
// }

export function createOfferReportColumns(): ColumnDef<OfferReportRecord>[] {
  return [
    {
      accessorKey: "offer_no",
      header: "Offer No",
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          to="/dashboard/offers/$name"
          params={{ name: row.original.offer_no }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.offer_no}
        </Link>
      ),
    },
    {
      accessorKey: "offer_date",
      header: "Offer Date",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.offer_date),
    },
    {
      accessorKey: "broker_type",
      header: "Broker Type",
      enableSorting: true,
    },
    {
      accessorKey: "lot_no",
      header: "Lot No",
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          to="/dashboard/lot/$name"
          params={{ name: row.original.lot_no }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.lot_no}
        </Link>
      ),
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
        <div className="text-right font-medium tabular-nums">
          {formatNumber(row.original.total_kgs, 2)}
        </div>
      ),
    },
    {
      accessorKey: "asking_rate",
      header: () => <div className="text-right">Asking Rate</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-bold tabular-nums">
          {formatMoney(row.original.asking_rate)}
        </div>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      enableSorting: false,
      cell: ({ row }) => row.original.remarks || "—",
    },
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
