import type { ColumnDef } from "@tanstack/react-table";

export interface TeaLot {
  name: string;
  lot_no: string;
  factory: string;
  entry_date: string;
  status?: string;
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
      enableSorting: true,
    },
    {
      accessorKey: "entry_date",
      header: "Entry Date",
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original.status || "Draft";

        return (
          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "bags",
      header: "Bags",
      enableSorting: true,
      cell: ({ row }) => row.original.bags.toLocaleString("en-IN"),
    },
    {
      id: "net_weight",
      accessorFn: (row) => row.bags * row.net_kg_per_bag,
      header: "Net Weight (kg)",
      enableSorting: true,
      cell: ({ row }) =>
        (row.original.bags * row.original.net_kg_per_bag).toLocaleString(
          "en-IN",
          { maximumFractionDigits: 2 },
        ),
    },
    {
      accessorKey: "net_kg_per_bag",
      header: "Kg / Bag",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.net_kg_per_bag.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        }),
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
