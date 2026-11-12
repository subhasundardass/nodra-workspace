import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { formatDate } from "@/lib/format";

export interface TableColumns {
  name: string;
  transfer_date?: string;
  lot?: string;
  "lot.lot_no"?: string;
  source_location_type?: "Factory" | "Warehouse";
  source_factory?: string;
  "source_factory.factory_name"?: string;
  source_warehouse?: string;
  "source_warehouse.title"?: string;
  destination_location_type?: "Factory" | "Warehouse";
  destination_factory?: string;
  "destination_factory.factory_name"?: string;
  destination_warehouse?: string;
  "destination_warehouse.title"?: string;
  bags?: number;
  quantity?: number;
  docstatus?: number;
  workflow_state?: string;
  remarks?: string;
}

function formatNumber(value: unknown, decimals = 0) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) return "—";

  return number.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getLocation(
  type?: "Factory" | "Warehouse",
  factory?: string,
  warehouse?: string,
) {
  if (type === "Factory") return factory || "—";
  if (type === "Warehouse") return warehouse || "—";
  return "—";
}

export function createColumns(
  onSelect?: (record: TableColumns) => void,
): ColumnDef<TableColumns>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfer No." />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      size: 140,
    },
    {
      accessorKey: "transfer_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) =>
        row.original.transfer_date
          ? formatDate(row.original.transfer_date)
          : "—",
      size: 110,
    },
    {
      id: "lot_no",
      accessorFn: (row) => row["lot.lot_no"] ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lot No." />
      ),
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>() || "—"}</span>
      ),
      size: 125,
    },
    {
      id: "source",
      accessorFn: (row) =>
        getLocation(
          row.source_location_type,
          row["source_factory.factory_name"],
          row["source_warehouse.title"],
        ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Source" />
      ),
      cell: ({ row, getValue }) => (
        <div className="min-w-0">
          <div className="truncate" title={getValue<string>()}>
            {getValue<string>() || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.source_location_type || ""}
          </div>
        </div>
      ),
      size: 170,
    },
    {
      id: "destination",
      accessorFn: (row) =>
        getLocation(
          row.destination_location_type,
          row["destination_factory.factory_name"],
          row["destination_warehouse.title"],
        ),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Destination" />
      ),
      cell: ({ row, getValue }) => (
        <div className="min-w-0">
          <div className="truncate" title={getValue<string>()}>
            {getValue<string>() || "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.destination_location_type || ""}
          </div>
        </div>
      ),
      size: 170,
    },
    {
      accessorKey: "bags",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bags" />
      ),
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(getValue())}
        </div>
      ),
      size: 90,
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quantity (KG)" />
      ),
      cell: ({ getValue }) => (
        <div className="text-right tabular-nums">
          {formatNumber(getValue(), 3)}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "docstatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ getValue }) => {
        const status = Number(getValue());

        const label =
          status === 51 ? "Confirmed" : status === 98 ? "Cancelled" : "Draft";

        return <span className="text-sm text-muted-foreground">{label}</span>;
      },
      size: 110,
    },
    {
      accessorKey: "remarks",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Remarks" />
      ),
      cell: ({ getValue }) => (
        <div
          className="max-w-[220px] truncate"
          title={String(getValue() ?? "")}
        >
          {String(getValue() || "—")}
        </div>
      ),
      size: 220,
    },
  ];
}
