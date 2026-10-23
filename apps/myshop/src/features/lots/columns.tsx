import type { ColumnDef } from "@tanstack/react-table";

export interface TableColumns {
  name: string;
  lot_no: string;
  factory: string;
  "factory.factory_name"?: string;
  entry_date: string;
  arrival_date: string;
  original_brand?: string;
  "original_brand.title"?: string;
  warehouse?: string;
  "warehouse.title"?: string;
  status?: string;
  docstatus: number;
  bags: number;
  net_kg_per_bag: number;
  grade: string;
  "grade.grade_code"?: string;
}

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits,
  });

const displayValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);

export function createColumns(
  onEdit: (lot: TableColumns) => void,
): ColumnDef<TableColumns>[] {
  return [
    {
      accessorKey: "name",
      header: "ID#",
      size: 110,
      minSize: 90,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onEdit(row.original)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      id: "lot_no",
      accessorKey: "lot_no",
      header: ({ column }) => (
        <button
          type="button"
          className="hover:text-foreground"
          onClick={column.getToggleSortingHandler()}
        >
          Lot No.
          {column.getIsSorted() === "asc"
            ? " ↑"
            : column.getIsSorted() === "desc"
              ? " ↓"
              : ""}
        </button>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.lot_no}</span>
      ),
    },
    {
      accessorKey: "entry_date",
      header: "Entry Date",
      size: 115,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "arrival_date",
      header: "Arrival Date",
      size: 115,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      id: "factory_name",
      header: "Factory",
      accessorFn: (row) => row["factory.factory_name"] || row.factory || "—",
      size: 160,
      minSize: 110,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      id: "original_brand_name",
      header: "Original Brand",
      accessorFn: (row) =>
        row["original_brand.title"] || row.original_brand || "—",
      size: 145,
      minSize: 100,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      id: "warehouse_title",
      header: "WH/Godown",
      accessorFn: (row) => row["warehouse.title"] || row.warehouse || "—",
      size: 115,
      minSize: 85,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      id: "grade_code",
      header: "Grade",
      accessorFn: (row) => row["grade.grade_code"] || row.grade || "—",
      size: 50,
      minSize: 30,
      maxSize: 50,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "bags",
      header: () => <div className="text-right">Bags</div>,
      size: 80,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.bags)}
        </div>
      ),
    },
    {
      accessorKey: "net_kg_per_bag",
      header: () => <div className="text-right">Kg/Bag</div>,
      size: 90,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.net_kg_per_bag, 2)}
        </div>
      ),
    },
    {
      id: "net_weight",
      accessorFn: (row) => row.bags * row.net_kg_per_bag,
      header: () => <div className="text-right">Net Weight (kg)</div>,
      size: 125,
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(Number(getValue()), 2)}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => {
        const status = Number(row.docstatus);

        return status === 51
          ? "Confirmed"
          : status === 98
            ? "Cancelled"
            : "Draft";
      },
      size: 110,
      enableSorting: true,
      cell: ({ getValue }) => {
        const status = getValue<string>();

        const styles =
          status === "Confirmed"
            ? "bg-emerald-50/70 text-emerald-700"
            : status === "Cancelled"
              ? "bg-red-50/70 text-red-700"
              : "bg-muted text-muted-foreground";

        const dotStyles =
          status === "Confirmed"
            ? "bg-emerald-500"
            : status === "Cancelled"
              ? "bg-red-500"
              : "bg-muted-foreground/60";

        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${styles}`}
          >
            <span className={`size-1.5 rounded-full ${dotStyles}`} />
            {status}
          </span>
        );
      },
    },
  ];
}
