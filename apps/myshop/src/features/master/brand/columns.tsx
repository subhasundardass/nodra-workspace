import type { ColumnDef } from "@tanstack/react-table";

import type { Brand } from ".";

export function createColumns(): ColumnDef<Brand>[] {
  return [
    {
      accessorKey: "title",
      header: "Brand Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "brand_type",
      header: "Brand Type",
      cell: ({ row }) => row.original.brand_type,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.is_active;

        return (
          <span
            className={
              isActive
                ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
  ];
}
