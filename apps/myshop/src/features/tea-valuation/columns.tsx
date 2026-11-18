import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";

export interface TableColumns {
  name: string;
  lot_no?: string;
  factory?: string;
  "factory.factory_name"?: string;
  bags?: number;
  net_kg_per_bag?: number;
  total_weight?: number;

  test_name?: string;
  sample_date?: string;
  tested_grade?: string;
  "tested_grade.grade_code"?: string;
  taste?: string;
  testing_status?: string;

  valuation_name?: string;
  valuation_date?: string;
  valuation_basis?: string;
  reference_rate?: number;
  final_grade?: string;
  "final_grade.grade_code"?: string;
  final_rate?: number;
  estimated_value?: number;
  valuation_status?: string;
}

const displayValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);

const displayNumber = (value: unknown) => {
  if (value == null || value === "") return "—";

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "—";
};

const displayCurrency = (value: unknown) => {
  if (value == null || value === "") return "—";

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      })
    : "—";
};

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
      accessorKey: "bags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bags" />
      ),
      cell: ({ getValue }) => displayNumber(getValue()),
    },
    {
      accessorKey: "total_weight",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Weight (kg)" />
      ),
      cell: ({ getValue }) => displayNumber(getValue()),
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
      accessorKey: "valuation_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Valuation Date" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "valuation_basis",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Basis" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "final_grade",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Final Grade" />
      ),
      cell: ({ row }) =>
        displayValue(
          row.original["final_grade.grade_code"] || row.original.final_grade,
        ),
    },
    {
      accessorKey: "final_rate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Final Rate / kg" />
      ),
      cell: ({ getValue }) => displayCurrency(getValue()),
    },
    {
      accessorKey: "estimated_value",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estimated Value" />
      ),
      cell: ({ getValue }) => displayCurrency(getValue()),
    },
    {
      accessorKey: "valuation_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Valuation Status" />
      ),
      cell: ({ getValue }) => displayValue(getValue()),
    },
  ];
}
