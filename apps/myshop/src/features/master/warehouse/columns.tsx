import type { ColumnDef } from "@tanstack/react-table";

export interface Warehouse {
  name: string;
  warehouse_name: string;
  factory?: string;
  disabled?: boolean;
}

export function createColumns(): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "warehouse_name",
      header: "Warehouse Name",
    },
    {
      accessorKey: "factory",
      header: "Factory",
    },
    {
      accessorKey: "disabled",
      header: "Status",
      cell: ({ row }) => (row.original.disabled ? "Disabled" : "Active"),
    },
    {
      accessorKey: "name",
      header: "ID",
    },
  ];
}
