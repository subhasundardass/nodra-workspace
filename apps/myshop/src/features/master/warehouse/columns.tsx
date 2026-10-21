import type { ColumnDef } from "@tanstack/react-table";
import { Warehouse } from ".";

export function createColumns(): ColumnDef<Warehouse>[] {
  return [
    {
      accessorKey: "title",
      header: "Warehouse",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "factory",
      header: "Factory",
      cell: ({ row }) => row.original.factory || "—",
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ row }) => row.original.city || "—",
    },
    {
      accessorKey: "manager",
      header: "Manager",
      cell: ({ row }) => row.original.manager || "—",
    },
    {
      accessorKey: "capacity",
      header: "Capacity (Kg)",
      cell: ({ row }) =>
        row.original.capacity == null
          ? "—"
          : row.original.capacity.toLocaleString("en-IN"),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.is_active;

        return (
          <span
            className={
              active
                ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];
}
