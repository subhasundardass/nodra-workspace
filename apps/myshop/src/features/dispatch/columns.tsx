import { formatDate } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export type DispatchRecord = {
  name: string;
  sale_book: string;
  sale_date: string | null;
  dispatch_date: string | null;
  party: string | null;
  broker: string | null;
  broker_name: string | null;
  transporter: string | null;
  lr_number: string | null;
  challan_number: string | null;
  total_bags: number;
  total_kgs: number;
  workflow_state: "Draft" | "Confirmed" | "Cancelled";
};

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<DispatchRecord>[] {
  return [
    {
      accessorKey: "name",
      header: "Sale ID",
      size: 150,
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original.name)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "sale_date",
      header: "Sale Date",
      size: 120,
      cell: ({ row }) => formatDate(row.original.sale_date),
    },

    {
      accessorKey: "broker_name",
      header: "Broker",
      size: 130,
      cell: ({ row }) => row.original.broker_name || "-",
    },
    {
      accessorKey: "total_bags",
      header: "Sold Bags",
      size: 90,
      cell: ({ row }) =>
        Number(row.original.total_bags ?? 0).toLocaleString("en-IN"),
    },
    {
      accessorKey: "total_kgs",
      header: "Sold Qty",
      size: 110,
      cell: ({ row }) =>
        Number(row.original.total_kgs ?? 0).toLocaleString("en-IN", {
          maximumFractionDigits: 3,
        }),
    },
    {
      accessorKey: "dispatch_date",
      header: "Dispatch Date",
      cell: ({ row }) => formatDate(row.original.dispatch_date),
      size: 100,
    },
    {
      accessorKey: "party",
      header: "Party",
      size: 160,
      cell: ({ row }) => row.original.party || "-",
    },
    {
      accessorKey: "transporter",
      header: "Transporter",
      size: 140,
      cell: ({ row }) => row.original.transporter || "-",
    },
    {
      accessorKey: "lr_number",
      header: "LR Number",
      size: 110,
      cell: ({ row }) => row.original.lr_number || "-",
    },
    {
      accessorKey: "challan_number",
      header: "Challan No.",
      size: 110,
      cell: ({ row }) => row.original.challan_number || "-",
    },

    {
      accessorKey: "workflow_state",
      header: "Status",
      size: 100,
    },
  ];
}
