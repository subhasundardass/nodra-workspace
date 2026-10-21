import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type NodraMethod =
  | {
      path?: string;
      requireAuth?: boolean;
      requiredRoles?: string[];
      middlewareCount?: number;
    }
  | string;

type NodraMethodsProps = {
  methods: NodraMethod[];
};

export default function NodraMethods({ methods }: NodraMethodsProps) {
  const data = React.useMemo(
    () =>
      methods.map((method) =>
        typeof method === "string" ? { path: method } : method,
      ),
    [methods],
  );

  const columns = React.useMemo<
    ColumnDef<{
      path?: string;
      requireAuth?: boolean;
      requiredRoles?: string[];
      middlewareCount?: number;
    }>[]
  >(
    () => [
      {
        accessorKey: "path",
        header: "Method",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.path ?? "—"}</span>
        ),
      },
      {
        accessorKey: "requireAuth",
        header: "Authentication",
        cell: ({ row }) =>
          row.original.requireAuth === undefined
            ? "—"
            : row.original.requireAuth
              ? "Required"
              : "Public",
      },
      {
        id: "roles",
        accessorFn: (row) => row.requiredRoles?.join(", ") ?? "",
        header: "Required Roles",
        cell: ({ row }) => row.original.requiredRoles?.join(", ") || "—",
      },
      {
        accessorKey: "middlewareCount",
        header: "Middleware",
        cell: ({ row }) => row.original.middlewareCount ?? "—",
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border  bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No methods found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {methods.length} methods
        </p>

        <div className="flex items-center gap-2">
          <button
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>

          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <button
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
