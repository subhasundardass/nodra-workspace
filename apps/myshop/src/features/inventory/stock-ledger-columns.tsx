import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { formatDate } from "@/lib/format";

export interface TableColumns {
  name: string;
  posting_date?: string;
  lot?: string;
  "lot.lot_no"?: string;
  movement_type?: string;
  location_type?: "Factory" | "Warehouse";
  factory?: string;
  factory_name?: string;
  warehouse?: string;
  warehouse_title?: string;
  bags?: number;
  quantity?: number;
  voucher_type?: string;
  voucher_no?: string;
  remarks?: string;
}

const INWARD_MOVEMENTS = new Set([
  "Opening Stock",
  "Lot Receipt",
  "Transfer In",
  "Adjustment In",
  "Return In",
]);

const OUTWARD_MOVEMENTS = new Set([
  "Transfer Out",
  "Dispatch",
  "Adjustment Out",
  "Return Out",
]);

function formatNumber(value: unknown, decimals = 0) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) return "—";

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function NumericHeader({ title }: { title: string }) {
  return (
    <div className="flex justify-end">
      <span>{title}</span>
    </div>
  );
}

export function createColumns(): ColumnDef<TableColumns>[] {
  return [
    {
      accessorKey: "posting_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.posting_date
            ? formatDate(row.original.posting_date)
            : "—"}
        </span>
      ),
      size: 110,
      minSize: 100,
    },
    {
      id: "lot_no",
      accessorFn: (row) => row["lot.lot_no"] ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lot No." />
      ),
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap font-bold">
          {getValue<string>() || "—"}
        </span>
      ),
      size: 125,
      minSize: 110,
      enableGlobalFilter: true,
    },
    {
      accessorKey: "movement_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Movement" />
      ),
      cell: ({ row }) => {
        const movement = row.original.movement_type;

        const color =
          movement && INWARD_MOVEMENTS.has(movement)
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : movement && OUTWARD_MOVEMENTS.has(movement)
              ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
              : "bg-muted text-muted-foreground";

        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${color}`}
          >
            {movement || "—"}
          </span>
        );
      },
      size: 155,
      minSize: 140,
      enableGlobalFilter: true,
    },
    {
      id: "location",
      accessorFn: (row) =>
        row.location_type === "Factory"
          ? row.factory_name || row.factory || "Factory"
          : row.location_type === "Warehouse"
            ? row.warehouse_title || row.warehouse || "Warehouse"
            : "",
      header: "Location",
      cell: ({ row }) => {
        const record = row.original;

        const location =
          record.location_type === "Factory"
            ? record.factory_name || record.factory
            : record.location_type === "Warehouse"
              ? record.warehouse_title || record.warehouse
              : undefined;

        return (
          <div className="truncate" title={location || ""}>
            {location || "—"}
            {record.location_type && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({record.location_type})
              </span>
            )}
          </div>
        );
      },
      size: 170,
      minSize: 140,
      enableGlobalFilter: true,
    },
    {
      id: "bags_in",
      accessorFn: (row) =>
        row.movement_type && INWARD_MOVEMENTS.has(row.movement_type)
          ? Number(row.bags ?? 0)
          : 0,
      header: () => <NumericHeader title="Bags In" />,
      cell: ({ getValue }) => (
        <div className="w-full text-right tabular-nums text-emerald-700 dark:text-emerald-400">
          {formatNumber(getValue(), 0)}
        </div>
      ),
      size: 95,
      minSize: 85,
      enableGlobalFilter: false,
    },
    {
      id: "bags_out",
      accessorFn: (row) =>
        row.movement_type && OUTWARD_MOVEMENTS.has(row.movement_type)
          ? Number(row.bags ?? 0)
          : 0,
      header: () => <NumericHeader title="Bags Out" />,
      cell: ({ getValue }) => (
        <div className="w-full text-right tabular-nums text-orange-700 dark:text-orange-400">
          {formatNumber(getValue(), 0)}
        </div>
      ),
      size: 100,
      minSize: 90,
      enableGlobalFilter: false,
    },
    {
      id: "quantity_in",
      accessorFn: (row) =>
        row.movement_type && INWARD_MOVEMENTS.has(row.movement_type)
          ? Number(row.quantity ?? 0)
          : 0,
      header: () => <NumericHeader title="KG In" />,
      cell: ({ getValue }) => (
        <div className="w-full text-right tabular-nums text-emerald-700 dark:text-emerald-400">
          {formatNumber(getValue(), 3)}
        </div>
      ),
      size: 115,
      minSize: 105,
      enableGlobalFilter: false,
    },
    {
      id: "quantity_out",
      accessorFn: (row) =>
        row.movement_type && OUTWARD_MOVEMENTS.has(row.movement_type)
          ? Number(row.quantity ?? 0)
          : 0,
      header: () => <NumericHeader title="KG Out" />,
      cell: ({ getValue }) => (
        <div className="w-full text-right tabular-nums text-orange-700 dark:text-orange-400">
          {formatNumber(getValue(), 3)}
        </div>
      ),
      size: 115,
      minSize: 105,
      enableGlobalFilter: false,
    },
    {
      id: "reference",
      accessorFn: (row) => row.voucher_no ?? "",
      header: "Reference",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div
            className="truncate text-sm font-medium text-muted-foreground"
            title={row.original.voucher_no || ""}
          >
            {row.original.voucher_no || "—"}
          </div>
          {/* <div className="text-xs text-muted-foreground">
            {row.original.voucher_type || ""}
          </div> */}
        </div>
      ),
      size: 145,
      minSize: 120,
      enableGlobalFilter: true,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => (
        <span
          className="block max-w-[280px] truncate text-muted-foreground"
          title={row.original.remarks || ""}
        >
          {row.original.remarks || "—"}
        </span>
      ),
      size: 280,
      minSize: 180,
      enableGlobalFilter: true,
      enableSorting: false,
    },
  ];
}
