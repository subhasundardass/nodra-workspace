import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";

export interface TableColumns {
  name: string;
  lot_no?: string;
  factory?: string;
  "factory.factory_name"?: string;
  entry_date?: string;
  arrival_date?: string;
  grade?: string;
  "grade.grade_code"?: string;
  original_brand?: string;
  "original_brand.title"?: string;
  bags?: number;
  net_kg_per_bag?: number;
  workflow_state?: string;

  test_name?: string;
  sample_date?: string;
  tested_grade?: string;
  "tested_grade.grade_code"?: string;
  taste?: string;
  testing_status?: string;
}

const displayValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);

export function createColumns(
  onOpen: (lot: TableColumns) => void,
): ColumnDef<TableColumns>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lot ID#" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original)}
        >
          {displayValue(row.original.name)}
        </button>
      ),
    },
    {
      accessorKey: "lot_no",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lot No." />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original)}
        >
          {displayValue(row.original.lot_no)}
        </button>
      ),
    },
    {
      id: "factory",
      accessorFn: (row) => row["factory.factory_name"] || row.factory,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Factory" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "arrival_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Arrival Date" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      id: "grade",
      accessorFn: (row) => row["grade.grade_code"] || row.grade,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Original Grade" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "bags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bags" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "sample_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Testing Date" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      id: "tested_grade",
      accessorFn: (row) => row["tested_grade.grade_code"] || row.tested_grade,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tested Grade" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "taste",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Taste" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "testing_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Test Status" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
  ];
}
