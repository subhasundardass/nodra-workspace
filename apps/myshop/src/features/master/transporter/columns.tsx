import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import type { ColumnDef } from "@tanstack/react-table";

export type Transporter = {
  name: string;
  title: string;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  workflow_state: string | null;
  docstatus: number;
};

export function createColumns(): ColumnDef<Transporter>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transporter Name" />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "contact_person",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact Person" />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      enableSorting: true,
    },
    {
      accessorKey: "workflow_state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
    },
  ];
}
