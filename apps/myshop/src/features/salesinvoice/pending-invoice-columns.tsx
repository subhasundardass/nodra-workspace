import type { ColumnDef } from "@tanstack/react-table";

export type PendingInvoiceDispatch = {
  name: string;
  dispatch: string;
  dispatch_date?: string;
  received_date?: string;

  sale_book: string;
  sale_date?: string;
  sale_type?: string;

  lot: string;
  lot_no?: string;
  mark_brand?: string;
  grade?: string;

  bags: number;
  kgs: number;
  rate: number;
};

export type PendingInvoiceGroup = {
  name: string;

  buyer: string;
  buyer_name: string;

  broker: string;
  broker_name: string;

  buyer_gstin: string;
  billing_address: string;
  shipping_address: string;
  place_of_supply: string;

  dispatch_count: number;
  total_bags: number;
  total_kgs: number;

  dispatches: PendingInvoiceDispatch[];
};

export function createColumns(
  onCreateInvoice: (record: PendingInvoiceGroup) => void,
): ColumnDef<PendingInvoiceGroup>[] {
  return [
    {
      accessorKey: "buyer_name",
      header: "Buyer",
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <div className="font-medium">{row.original.buyer_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.buyer}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "broker_name",
      header: "Broker",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.broker_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.broker}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "stock_location",
      header: "Stock Location",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.broker_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.broker}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "dispatch_count",
      header: () => <div className="text-right">Dispatches</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.dispatch_count}
        </div>
      ),
    },
    {
      accessorKey: "total_bags",
      header: () => <div className="text-right">Total Bags</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{row.original.total_bags}</div>
      ),
    },
    {
      accessorKey: "total_kgs",
      header: () => <div className="text-right">Total Kgs</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {Number(row.original.total_kgs).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
          })}
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            onCreateInvoice(row.original);
          }}
        >
          Create Invoice
        </button>
      ),
    },
  ];
}
