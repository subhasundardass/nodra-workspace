import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { formatDate } from "@/lib/format";

export interface OfferSheetRecord {
  name: string;
  offer_date?: string;
  broker_type?: string;
  offer_lots?: Array<{ lot?: string }>;
  total_bags?: number;
  total_kg?: number;
  workflow_state?: string;
  [key: string]: unknown;
}

const formatNumber = (value: unknown, maximumFractionDigits = 0) =>
  Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits,
  });

const displayValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<OfferSheetRecord, unknown>[] {
  return [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Offer ID" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original.name)}
        >
          {row.original.name}
        </button>
      ),
      enableSorting: true,
      size: 120,
      minSize: 120,
    },
    {
      id: "offer_date",
      accessorKey: "offer_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Offer Date" />
      ),
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        return value ? formatDate(value) : "—";
      },
      enableSorting: true,
      size: 115,
      minSize: 115,
    },
    {
      id: "broker_type",
      accessorKey: "broker_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Broker Type" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
      enableSorting: true,
      size: 120,
      minSize: 120,
    },
    {
      id: "offer_lots",
      accessorFn: (row) => row.offer_lots?.length ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="No. of Lots" />
      ),
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(getValue())}
        </div>
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 100,
      minSize: 100,
    },
    {
      id: "total_bags",
      accessorKey: "total_bags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Bags" />
      ),
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(getValue())}
        </div>
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 110,
      minSize: 110,
    },
    {
      id: "total_kg",
      accessorKey: "total_kg",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total KG" />
      ),
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(getValue(), 2)}
        </div>
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 120,
      minSize: 120,
    },
    {
      id: "workflow_state",
      accessorKey: "workflow_state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const status = String(getValue() ?? "—");

        const styles =
          status === "Confirmed"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : status === "Draft"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              : "bg-muted text-muted-foreground";

        return (
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium ${styles}`}
          >
            {status}
          </span>
        );
      },
      enableSorting: true,
      size: 110,
      minSize: 110,
    },
  ];
}
