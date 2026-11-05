import { formatDate, formatMoney } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export type DispatchRecord = {
  sale_book: string;
  sale_date: string | null;
  buyer: string | null;
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
  sale_type: "Bid" | "Advance" | null;
  rate: number;
  broker: string | null;
  broker_name: string | null;
};

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<DispatchRecord>[] {
  return [
    {
      accessorKey: "sale_book",
      header: "Sale Book",
      size: 110,
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original.sale_book)}
        >
          {row.original.sale_book}
        </button>
      ),
    },
    {
      accessorKey: "lot_no",
      header: "Lot No.",
      size: 90,
    },
    {
      accessorKey: "brand",
      header: "Mark / Brand",
    },
    {
      accessorKey: "grade",
      header: "Grade",
      size: 70,
    },
    {
      accessorKey: "buyer",
      header: "Buyer",
      size: 150,
      cell: ({ row }) => row.original.buyer || "-",
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
      size: 90,
      cell: ({ row }) => Number(row.original.total_kg).toLocaleString("en-IN"),
    },
    {
      accessorKey: "sale_date",
      header: "Sale Date",
      size: 100,
      cell: ({ row }) => formatDate(row.original.sale_date),
    },
    {
      accessorKey: "sale_type",
      header: "Type",
      size: 80,
    },
    {
      accessorKey: "rate",
      header: "Rate",
      size: 100,
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
