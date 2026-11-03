import { formatDate, formatMoney } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export type SaleBookRecord = {
  lot: string;
  lot_no: string;
  factory: string | null;
  original_brand: string | null;
  brand: string | null;
  original_grade: string | null;
  grade: string | null;
  bags: number;
  net_kg_per_bag: number;
  total_kg: number;
  arrival_date: string | null;
  tea_testing: string | null;
  tested_grade: string | null;
  test_information: string | null;
  tf: string | null;
  offer: string | null;
  asking_price: number;
  sale_type: "Bid" | "Advance" | null;
  rate: number;
  broker: string | null;
  broker_name: string | null;
};

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<SaleBookRecord>[] {
  return [
    {
      accessorKey: "lot_no",
      header: "Lot No.",
      size: 30,
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original.lot)}
        >
          {row.original.lot_no}
        </button>
      ),
    },
    {
      accessorKey: "brand",
      header: "Mark / Brand",
    },
    {
      accessorKey: "grade",
      header: "Grade",
      size: 30,
    },
    {
      accessorKey: "bags",
      header: "Bags",
      size: 65,
    },
    {
      accessorKey: "net_kg_per_bag",
      header: "Kgs",
      size: 70,
    },
    {
      accessorKey: "total_kg",
      header: "Total Kg",
      cell: ({ row }) => Number(row.original.total_kg).toLocaleString("en-IN"),
      size: 70,
    },
    {
      accessorKey: "arrival_date",
      header: "Arrival Date",
      cell: ({ row }) => formatDate(row.original.arrival_date),
      size: 70,
    },
    {
      accessorKey: "test_information",
      header: "Test Information",
    },
    {
      accessorKey: "tf",
      header: "T/F",
    },
    {
      accessorKey: "sale_type",
      header: "Type",
      size: 30,
    },
    {
      accessorKey: "asking_price",
      header: "Asking Price",
      size: 30,
      cell: ({ row }) => (
        <div className="text-right">
          {formatMoney(row.original.asking_price)}
        </div>
      ),
    },
    {
      accessorKey: "rate",
      header: "Rate",
      size: 30,

      cell: ({ row }) => (
        <div className="text-right font-semibold">
          {formatMoney(row.original.rate)}
        </div>
      ),
    },
    {
      accessorKey: "broker_name",
      header: "Broker",
      size: 130,

      cell: ({ row }) => row.original.broker_name || "-",
    },
  ];
}
