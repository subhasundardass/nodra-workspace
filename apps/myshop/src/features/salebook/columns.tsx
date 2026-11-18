import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { formatDate, formatMoney } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";

export type SaleBookRecord = {
  name: string;
  lot: string;
  lot_no: string;
  sale_book_name: string | null;

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

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits,
  });

const displayValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<SaleBookRecord>[] {
  return [
    {
      accessorKey: "lot_no",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lot No." />
      ),
      enableSorting: true,
      size: 60,
      minSize: 60,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => {
            if (row.original.sale_book_name) {
              onOpen(row.original.sale_book_name);
            }
          }}
        >
          {row.original.lot_no}
        </button>
      ),
    },
    {
      accessorKey: "brand",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mark / Brand" />
      ),
      enableSorting: true,
      size: 160,
      minSize: 160,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "grade",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Grade" />
      ),
      enableSorting: true,
      size: 65,
      minSize: 65,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "bags",
      id: "bags",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Bags"
          className="[&>span:first-child]:ml-auto"
        />
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 65,
      minSize: 65,
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(Number(getValue()))}
        </div>
      ),
    },
    {
      accessorKey: "net_kg_per_bag",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Kgs"
          className="[&>span:first-child]:ml-auto"
        />
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 70,
      minSize: 70,
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(Number(getValue()), 3)}
        </div>
      ),
    },
    {
      accessorKey: "total_kg",
      id: "total_kg",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Total Kg"
          className="[&>span:first-child]:ml-auto"
        />
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 90,
      minSize: 90,
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(Number(getValue()), 3)}
        </div>
      ),
    },
    {
      accessorKey: "test_information",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Test Information" />
      ),
      enableSorting: true,
      size: 180,
      minSize: 180,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    // {
    //   accessorKey: "tf",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="T/F" />
    //   ),
    //   enableSorting: true,
    //   size: 60,
    //   minSize: 60,
    //   cell: ({ getValue }) => displayValue(getValue()),
    // },
    {
      accessorKey: "sale_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      enableSorting: true,
      size: 85,
      minSize: 85,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "rate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Rate"
          className="[&>span:first-child]:ml-auto"
        />
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 100,
      minSize: 100,
      cell: ({ row }) => {
        const rate = Number(row.original.rate);

        return (
          <div className="text-right font-semibold tabular-nums">
            {rate > 0 ? formatMoney(rate) : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "broker_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Broker" />
      ),
      enableSorting: true,
      size: 130,
      minSize: 130,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Remarks" />
      ),
      enableSorting: true,
      size: 130,
      minSize: 130,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "workflow_state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      size: 110,
      minSize: 110,
      cell: ({ getValue }) => {
        const status = getValue<string>() || "Draft";

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
    {
      accessorKey: "lot",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sale ID." />
      ),
      enableSorting: true,
      size: 110,
      minSize: 110,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() =>
            onOpen(row.original.sale_book_name || row.original.lot)
          }
        >
          {displayValue(row.original.sale_book_name)}
        </button>
      ),
    },
    {
      id: "total_amount",
      accessorFn: (row) =>
        Number(row.sold_quantity ?? 0) * Number(row.rate ?? 0),
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Total Amount"
          className="[&>span:first-child]:ml-auto"
        />
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 145,
      cell: ({ getValue }) => (
        <div className="text-right font-bold tabular-nums">
          {formatMoney(Number(getValue()))}
        </div>
      ),
    },
    {
      accessorKey: "sale_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sale Date" />
      ),
      enableSorting: true,
      size: 115,
      minSize: 115,
      cell: ({ getValue }) =>
        displayValue(formatDate(getValue<string | null>())),
    },
  ];
}
