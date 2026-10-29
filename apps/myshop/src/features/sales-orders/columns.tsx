import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";

export interface TableColumns {
  name: string;
  order_date?: string;
  party?: string;
  sales_channel?: string;
  lot?: string;
  ordered_bags?: number | string;
  total_weight_kg?: number | string;
  total_amount?: number | string;
  workflow_state: string;
  docstatus?: number;
}

function displayValue(value: unknown): string {
  return value == null || value === "" ? "—" : String(value);
}

function displayNumber(value: unknown): string {
  if (value == null || value === "") return "—";

  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-IN")
    : String(value);
}

export function createColumns(
  onEdit: (salesOrder: TableColumns) => void,
): ColumnDef<TableColumns>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order ID" />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onEdit(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "order_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order Date" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "party",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Party" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-medium">{displayValue(getValue())}</span>
      ),
    },
    {
      accessorKey: "sales_channel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Channel" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    // {
    //   accessorKey: "warehouse",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="Warehouse" />
    //   ),
    //   enableSorting: true,
    //   cell: ({ getValue }) => displayValue(getValue()),
    // },
    {
      accessorKey: "total_bags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bags" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => displayNumber(getValue()),
    },
    {
      accessorKey: "total_weight",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Weight (kg)" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => displayNumber(getValue()),
    },
    {
      accessorKey: "grand_total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Grand Total (₹)" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => displayNumber(getValue()),
    },
    {
      accessorKey: "workflow_state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="State" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => {
        const state = displayValue(getValue());

        const styles =
          state === "Confirmed"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : state === "Cancelled"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              : "bg-muted text-muted-foreground";

        return (
          <span
            className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${styles}`}
          >
            {state}
          </span>
        );
      },
    },
  ];
}
