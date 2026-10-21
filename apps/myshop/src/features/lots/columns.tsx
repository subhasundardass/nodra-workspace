import type { ColumnDef } from "@tanstack/react-table";

export interface TeaLot {
  name: string;
  title: string;
}

export function createColumns(
  onEdit: (lot: TeaLot) => void,
): ColumnDef<TeaLot>[] {
  return [
    {
      accessorKey: "title",
      header: "Lot",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => onEdit(row.original)}
          >
            Edit
          </button>
        </div>
      ),
    },
  ];
}
