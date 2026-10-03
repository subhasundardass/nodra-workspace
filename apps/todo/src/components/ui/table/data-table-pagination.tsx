import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { defaultRowsPerPageQueryOptions } from "@/modules/settings/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Table } from "@tanstack/react-table";
import { useEffect, useRef } from "react";

interface DataTablePaginationProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const { data: defaultRowsPerPage } = useSuspenseQuery(
    defaultRowsPerPageQueryOptions(),
  );

  // Track the last value we applied, so we re-apply when it changes
  // (e.g. after the settings mutation invalidates the query).
  const appliedPageSize = useRef<number | null>(null);

  useEffect(() => {
    if (appliedPageSize.current === defaultRowsPerPage) return;

    table.setPageSize(defaultRowsPerPage);
    appliedPageSize.current = defaultRowsPerPage;
  }, [table, defaultRowsPerPage]);

  const availablePageSizes = Array.from(
    new Set([...pageSizeOptions, defaultRowsPerPage]),
  ).sort((a, b) => a - b);

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-2 overflow-auto p-1 sm:gap-8",
        className,
      )}
      {...props}
    >
      <div className="text-muted-foreground text-sm whitespace-nowrap">
        {table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </>
        ) : (
          <>{table.getFilteredRowModel().rows.length} row(s) total.</>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-6 lg:gap-8">
        <div className="hidden items-center space-x-2 sm:flex">
          <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>

          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              const size = Number(value);
              table.setPageSize(size);
              // Prevent the effect from overriding the user's manual choice
              // on the next render if defaultRowsPerPage hasn't changed.
              appliedPageSize.current = size;
            }}
          >
            <SelectTrigger className="h-8 w-18 data-size:h-8">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>

            <SelectContent side="top">
              {availablePageSizes.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center text-sm font-medium whitespace-nowrap">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            aria-label="Go to first page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <Icons.chevronsLeft />
          </Button>

          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <Icons.chevronLeft />
          </Button>

          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <Icons.chevronRight />
          </Button>

          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <Icons.chevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
