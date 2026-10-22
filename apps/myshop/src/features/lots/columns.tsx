import type { ColumnDef } from "@tanstack/react-table";

export interface TableColumns {
  name: string;
  lot_no: string;
  factory: string; // Keep the Factory ID
  "factory.factory_name"?: string;
  entry_date: string;
  original_brand?: string;
  "original_brand.title"?: string;
  status?: string;
  bags: number;
  net_kg_per_bag: number;
  grade: string;
  "grade.grade_code"?: string;
}

export function createColumns(
  onEdit: (lot: TableColumns) => void,
): ColumnDef<TableColumns>[] {
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
      accessorKey: "entry_date",
      header: "Entry Date",
      enableSorting: true,
    },
    {
      id: "factory_name",
      header: "Factory Name",
      accessorFn: (row) => row["factory.factory_name"] ?? row.factory,
      enableSorting: true,
    },
    {
      id: "original_brand_name",
      header: "Original Brand",
      accessorFn: (row) => row["original_brand.title"] ?? row.original_brand,
      enableSorting: true,
    },
    {
      id: "grade_code",
      header: "Grade",
      accessorFn: (row) => row["grade.grade_code"] ?? row.grade,
      enableSorting: true,
    },
    {
      accessorKey: "bags",
      header: () => <div className="text-right">Bags</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.bags.toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      accessorKey: "net_kg_per_bag",
      header: () => <div className="text-right">Kg/Per Bag</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.net_kg_per_bag.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
    {
      id: "net_weight",
      accessorFn: (row) => row.bags * row.net_kg_per_bag,
      header: () => <div className="text-right">Net Weight (kg)</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right">
          {(row.original.bags * row.original.net_kg_per_bag).toLocaleString(
            "en-IN",
            { maximumFractionDigits: 2 },
          )}
        </div>
      ),
    },

    {
      accessorKey: "status",
      header: () => <div className="text-right">Status</div>,
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original.status || "Draft";

        return (
          <div className="text-right">
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-right">
              {status}
            </span>
          </div>
        );
      },
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
