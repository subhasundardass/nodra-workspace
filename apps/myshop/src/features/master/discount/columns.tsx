import { formatDate } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export type DiscountRecord = {
  name: string;
  title: string;
  effective_from: string;
  effective_to?: string | null;
  is_active: boolean;
};

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<DiscountRecord>[] {
  return [
    {
      accessorKey: "name",
      header: "ID#",
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original.name)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
    },

    {
      accessorKey: "effective_from",
      header: "Effective From",
      cell: ({ row }) => formatDate(row.original.effective_from) || "-",
    },
    {
      accessorKey: "effective_to",
      header: "Effective To",
      cell: ({ row }) => formatDate(row.original.effective_to) || "-",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={
            row.original.is_active ? "text-green-600" : "text-muted-foreground"
          }
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];
}
