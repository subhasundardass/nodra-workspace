import { formatDate } from "@/lib/format";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import type { ColumnDef } from "@tanstack/react-table";

export type DispatchRecord = {
  name: string;
  sale_book: string;
  sale_date: string | null;
  dispatch_date: string | null;
  lot_id: string | null;
  lot_no: string | null;
  party: string | null;
  party_name: string | null;
  broker: string | null;
  broker_name: string | null;
  transporter: string | null;
  transporter_name: string | null;
  lr_number: string | null;
  challan_number: string | null;
  sold_bags: number;
  sold_quantity: number;
  rate: number;
  workflow_state: "Draft" | "Confirmed" | "Cancelled";
};

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  Number(value ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits,
  });

const formatCurrency = (value: number) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const displayValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);

export function createColumns(
  onOpen: (name: string) => void,
): ColumnDef<DispatchRecord>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sale ID" />
      ),
      enableSorting: true,
      size: 130,
      minSize: 110,
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => onOpen(row.original.name)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "sale_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sale Date" />
      ),
      enableSorting: true,
      size: 115,
      cell: ({ getValue }) =>
        displayValue(formatDate(getValue<string | null>())),
    },
    {
      accessorKey: "lot_no",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lot No" />
      ),
      enableSorting: true,
      size: 115,
      cell: ({ getValue }) => displayValue(getValue<string | null>()),
    },
    {
      accessorKey: "broker_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Broker" />
      ),
      enableSorting: true,
      size: 160,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "party_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Party" />
      ),
      enableSorting: true,
      size: 160,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "sold_bags",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Sold Bags"
          className="[&>span:first-child]:ml-auto"
        />
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 100,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.sold_bags)}
        </div>
      ),
    },
    {
      accessorKey: "sold_quantity",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Sold Qty (KG)"
          className="[&>span:first-child]:ml-auto"
        />
      ),
      meta: {
        className: "text-right tabular-nums",
      },
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatNumber(row.original.sold_quantity, 3)}
        </div>
      ),
    },
    {
      accessorKey: "rate",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Sold Rate"
          className="w-full [&>span]:ml-auto"
        />
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="w-full text-right tabular-nums">
          {formatCurrency(row.original.rate)}
        </div>
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
          {formatCurrency(Number(getValue()))}
        </div>
      ),
    },
    {
      accessorKey: "dispatch_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dispatch Date" />
      ),
      enableSorting: true,
      size: 120,
      cell: ({ getValue }) =>
        displayValue(formatDate(getValue<string | null>())),
    },
    {
      accessorKey: "transporter_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transporter" />
      ),
      enableSorting: true,
      size: 150,
      cell: ({ getValue }) => displayValue(getValue()),
    },
    {
      accessorKey: "workflow_state",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      size: 110,
      cell: ({ getValue }) => {
        const status = getValue<string>();

        const styles =
          status === "Confirmed"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : status === "Cancelled"
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              : "bg-muted text-muted-foreground";

        const dotStyles =
          status === "Confirmed"
            ? "bg-emerald-500"
            : status === "Cancelled"
              ? "bg-red-500"
              : "bg-muted-foreground";

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
