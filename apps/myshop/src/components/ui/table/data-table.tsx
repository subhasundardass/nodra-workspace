import { type Table as TanstackTable, flexRender } from "@tanstack/react-table";
import type * as React from "react";

import { DataTablePagination } from "@/components/ui/table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommonPinningStyles } from "@/lib/data-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type DataTableTotal = {
  fieldname: string;
  value: string;
  label?: string;
};

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  totals?: DataTableTotal[];
}

export function DataTable<TData>({
  table,
  actionBar,
  children,
  totals,
}: DataTableProps<TData>) {
  const visibleColumns = table.getVisibleLeafColumns();

  return (
    <div className="flex flex-1 flex-col space-y-4">
      {children}

      <div className="relative flex flex-1">
        <div className="absolute inset-0 flex overflow-hidden rounded-lg border">
          <ScrollArea className="h-full w-full">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="font-bold text-foreground"
                        style={{
                          ...getCommonPinningStyles({
                            column: header.column,
                          }),
                        }}
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
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="group"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const cellClass = row.getIsSelected()
                          ? "bg-muted group-hover:!bg-muted/80"
                          : index % 2 === 0
                            ? "bg-blue-50 group-hover:!bg-blue-100 dark:bg-background dark:group-hover:!bg-muted/50"
                            : "bg-background group-hover:!bg-muted/50 dark:bg-muted/70 dark:group-hover:!bg-muted";

                        return (
                          <TableCell
                            key={cell.id}
                            className={cellClass}
                            style={{
                              ...getCommonPinningStyles({
                                column: cell.column,
                              }),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="h-24 text-center"
                    >
                      {table.getState().columnFilters.length > 0
                        ? "No results match your filters."
                        : "No data to display yet."}
                    </TableCell>
                  </TableRow>
                )}

                {/* Optional totals row */}
                {/* Optional totals row */}
                {totals &&
                  totals.length > 0 &&
                  table.getRowModel().rows.length > 0 && (
                    <TableRow className="border-t-2 bg-muted/70 font-bold">
                      {visibleColumns.map((column, index) => {
                        const total = totals.find(
                          (item) => item.fieldname === column.id,
                        );

                        const columnClass =
                          (
                            column.columnDef.meta as
                              { className?: string } | undefined
                          )?.className ?? "";

                        return (
                          <TableCell
                            key={column.id}
                            className={`bg-muted/70 font-bold ${
                              column.columnDef.meta?.className ?? ""
                            }`}
                            style={getCommonPinningStyles({ column })}
                          >
                            {total ? total.value : index === 0 ? "Total" : ""}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
              </TableBody>
            </Table>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />

        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
