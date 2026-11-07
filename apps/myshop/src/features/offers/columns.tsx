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
export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<OfferSheetRecord, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Offer ID" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover"
          onClick={() => onOpen(row.original.name)}
        >
          {row.original.name}
        </button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "offer_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Offer Date" />
      ),
      cell: ({ getValue }) =>
        String(formatDate(getValue<string | null>()) ?? "-"),
      enableSorting: true,
    },
    {
      accessorKey: "broker_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Broker Type" />
      ),
      cell: ({ getValue }) => String(getValue() ?? "-"),
      enableSorting: true,
    },
    {
      accessorKey: "offer_lots",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="No. of Lots" />
      ),
      cell: ({ row }) => row.original.offer_lots?.length ?? 0,
      enableSorting: false,
    },
    {
      accessorKey: "total_bags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Bags" />
      ),
      cell: ({ getValue }) => Number(getValue() ?? 0).toLocaleString("en-IN"),
      enableSorting: true,
    },
    {
      accessorKey: "total_kg",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total KG" />
      ),
      cell: ({ getValue }) =>
        Number(getValue() ?? 0).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        }),
      enableSorting: true,
    },
    {
      accessorKey: "workflow_state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const status = String(getValue() ?? "-");

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
    },
  ];
}
