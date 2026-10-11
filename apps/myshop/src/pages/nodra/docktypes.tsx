import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table";

import { useDataTable } from "@/hooks/use-data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DocType = {
  name: string;
  module?: string;
  is_child?: boolean;
  is_submittable?: boolean;
  fields?: Array<{
    fieldname: string;
    fieldtype: string;
    label: string;
  }>;
};

type Props = {
  doctypes?: DocType[];
};

export default function NodraDocTypes({ doctypes = [] }: Props) {
  const columns = React.useMemo<ColumnDef<DocType>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "module",
        header: "Module",
        cell: ({ row }) => row.original.module ?? "—",
      },
      {
        id: "fields",
        accessorFn: (row) => row.fields?.length ?? 0,
        header: "Fields",
        cell: ({ row }) => row.original.fields?.length ?? 0,
      },
      {
        accessorKey: "is_child",
        header: "Type",
        cell: ({ row }) => (row.original.is_child ? "Child" : "Standard"),
      },
      {
        accessorKey: "is_submittable",
        header: "Submittable",
        cell: ({ row }) => (row.original.is_submittable ? "Yes" : "No"),
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: doctypes,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border   bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-bold bg-secondary text-primary"
                  >
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
                  No DocTypes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} DocTypes
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
            Page {table.getState().pagination.pageIndex + 1}
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
