import type { ColumnDef } from "@tanstack/react-table";

export interface TeaLot {
  name: string;
  lot_no: string;
  factory: string;
  entry_date: string;
  bags: number;
  net_kg_per_bag: number;
}

export function createColumns(
  onEdit: (lot: TeaLot) => void,
): ColumnDef<TeaLot>[] {
  return [
    {
      accessorKey: "lot_no",
      header: "Lot No.",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.lot_no}</span>
      ),
    },
    {
      accessorKey: "factory",
      header: "Factory",
    },
    {
      accessorKey: "entry_date",
      header: "Entry Date",
    },
    {
      accessorKey: "bags",
      header: "Bags",
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
