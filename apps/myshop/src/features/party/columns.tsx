import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";

export interface TableColumns {
  name: string;
  title: string;
  party_type: string;
  is_supplier?: boolean | string | number;
  is_buyer?: boolean | string | number;
  is_agent?: boolean | string | number;
  is_tea_owner?: boolean | string | number;
  is_transporter?: boolean | string | number;
  phone?: string;
  email?: string;
  is_active: boolean | string | number;
  workflow_state: string;
  docstatus?: number;
}

function getRoles(party: TableColumns): string[] {
  const roles = [
    { field: party.is_supplier, label: "Supplier" },
    { field: party.is_buyer, label: "Buyer" },
    { field: party.is_agent, label: "Agent / Broker" },
    { field: party.is_tea_owner, label: "Tea Owner" },
    { field: party.is_transporter, label: "Transporter" },
  ];

  return roles.filter(({ field }) => isActive(field)).map(({ label }) => label);
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
      accessorKey: "party_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      enableSorting: true,
    },
    {
      id: "roles",
      accessorFn: (row) => getRoles(row).join(", "),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Roles" />
      ),
      enableSorting: true,
      cell: ({ row }) => {
        const roles = getRoles(row.original);

        return roles.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <span
                key={role}
                className="inline-flex rounded-md bg-muted px-2 py-1  font-medium text-muted-foreground"
              >
                {role}
              </span>
            ))}
          </div>
        ) : (
          "—"
        );
      },
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
          state === "Active"
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
