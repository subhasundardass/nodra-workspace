import type { ColumnDef } from "@tanstack/react-table";

export interface Factory {
  name: string;
  factory_name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export function createColumns(): ColumnDef<Factory>[] {
  return [
    {
      accessorKey: "factory_name",
      header: "Factory Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.factory_name}</span>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => row.original.address || "—",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "—",
    },
  ];
}
