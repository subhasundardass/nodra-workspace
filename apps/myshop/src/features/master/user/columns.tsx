import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { formatDate, formatTimestamp } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export interface TableColumns {
  name: string;
  full_name: string;
  email?: string;
  enabled: boolean;
  last_login?: string | null;
  last_ip?: string | null;
  user_type: string;
  // roles: string[] | string;
}

const displayValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);

export function createColumns(
  onEdit: (user: TableColumns) => void,
): ColumnDef<TableColumns>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID#" />
      ),
      enableSorting: true,
      size: 110,
      minSize: 90,
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
      accessorKey: "full_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Full Name" />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-semibold">
          {displayValue(row.original.full_name)}
        </span>
      ),
    },
    {
      accessorKey: "user_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      enableSorting: true,
      cell: ({ row }) => displayValue(row.original.user_type),
    },

    {
      accessorKey: "enabled",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Enabled" />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span
          className={
            row.original.enabled
              ? "font-medium text-green-600"
              : "font-medium text-muted-foreground"
          }
        >
          {row.original.enabled ? "Enabled" : "Disabled"}
        </span>
      ),
    },

    {
      accessorKey: "last_login",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span>{formatTimestamp(row.original.last_login?.toString())}</span>
      ),
    },
    {
      accessorKey: "last_ip",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last IP" />
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {displayValue(row.original.last_ip)}
        </span>
      ),
    },
  ];
}
