import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";

export interface TableColumns {
  name: string;
  title: string;
  party_type: string;

  phone?: string;
  email?: string;
  is_active: boolean | string | number;
  workflow_state: string;
  docstatus?: number;
}

function displayValue(value: unknown): string {
  return value == null || value === "" ? "—" : String(value);
}

function isActive(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export function createColumns(
  onEdit: (party: TableColumns) => void,
): ColumnDef<TableColumns>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Party ID" />
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
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Party Name" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-medium">{displayValue(getValue())}</span>
      ),
    },

    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Is Active" />
      ),
      enableSorting: true,
      cell: ({ getValue }) => {
        const active = isActive(getValue());

        return (
          <span
            className={
              active
                ? "inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {active ? "Yes" : "No"}
          </span>
        );
      },
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
