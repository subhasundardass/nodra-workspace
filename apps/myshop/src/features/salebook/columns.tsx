import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export type SaleBookRecord = {
  name: string; // Lot ID used for navigation
  lot: string; // Linked Lot document ID
  sale_book_name: string | null; // Actual SaleBook document ID

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

  sold_bags: number;
  sold_quantity: number;

  broker: string | null;
  broker_name: string | null;

  sale_date: string | null;
  remarks: string;
  workflow_state: string | null;
};

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<SaleBookRecord>[] {
  return [
    {
      accessorKey: "lot",
      header: "Lot No.",
      size: 100,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original.name)}
        >
          {row.original.lot}
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
      accessorKey: "rate",
      header: "Rate",
      size: 30,
      cell: ({ row }) => {
        const rate = Number(row.original.rate);

        return (
          <div className="text-right font-semibold">
            {rate > 0 ? formatMoney(rate) : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "broker_name",
      header: "Broker",
      size: 130,

      cell: ({ row }) => row.original.broker_name || "-",
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      size: 130,

      cell: ({ row }) => row.original.remarks || "-",
    },
    {
      accessorKey: "workflow_state",
      header: "Status",
      size: 110,
      cell: ({ row }) => {
        const status = row.original.workflow_state || "Draft";

        return (
          <Badge
            variant={
              status === "Confirmed"
                ? "default"
                : status === "Cancelled"
                  ? "destructive"
                  : "secondary"
            }
          >
            {status}
          </Badge>
        );
      },
    },
  ];
}
