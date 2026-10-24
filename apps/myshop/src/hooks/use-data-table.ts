import {
  type ColumnFiltersState,
  type ColumnPinningState,
  type FilterFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useNavigate, useSearch } from "@tanstack/react-router";
import * as React from "react";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { parseSortingState, serializeSortingState } from "@/lib/parsers";
import type { ExtendedColumnSort } from "@/types/data-table";

const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;

type GlobalFilterRule = {
  field: string;
  operator:
    | "contains"
    | "equals"
    | "not_equals"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_set";
  value: string;
};

type GlobalFilterValue = {
  search?: string;
  rules?: GlobalFilterRule[];
};

function valueToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value) ?? "";
  return String(value);
}

function compareFilterValues(actual: unknown, rule: GlobalFilterRule): boolean {
  const actualText = valueToString(actual).trim();
  const expectedText = rule.value.trim();
  const actualLower = actualText.toLocaleLowerCase();
  const expectedLower = expectedText.toLocaleLowerCase();

  switch (rule.operator) {
    case "contains":
      return actualLower.includes(expectedLower);
    case "equals":
      return actualLower === expectedLower;
    case "not_equals":
      return actualLower !== expectedLower;
    case "starts_with":
      return actualLower.startsWith(expectedLower);
    case "ends_with":
      return actualLower.endsWith(expectedLower);
    case "is_empty":
      return actualText.length === 0;
    case "is_set":
      return actualText.length > 0;
    case "greater_than": {
      const actualNumber = Number(actualText);
      const expectedNumber = Number(expectedText);
      if (
        actualText !== "" &&
        expectedText !== "" &&
        Number.isFinite(actualNumber) &&
        Number.isFinite(expectedNumber)
      ) {
        return actualNumber > expectedNumber;
      }
      return actualText > expectedText;
    }
    case "less_than": {
      const actualNumber = Number(actualText);
      const expectedNumber = Number(expectedText);
      if (
        actualText !== "" &&
        expectedText !== "" &&
        Number.isFinite(actualNumber) &&
        Number.isFinite(expectedNumber)
      ) {
        return actualNumber < expectedNumber;
      }
      return actualText < expectedText;
    }
    default:
      return true;
  }
}

const doctypeGlobalFilter: FilterFn<unknown> = (
  row,
  _columnId,
  filterValue,
) => {
  if (typeof filterValue === "string") {
    const query = filterValue.trim().toLocaleLowerCase();
    if (!query) return true;
    return row.getAllCells().some((cell) => {
      if (cell.column.id === "actions") return false;
      return valueToString(cell.getValue()).toLocaleLowerCase().includes(query);
    });
  }

  if (!filterValue || typeof filterValue !== "object") return true;

  const filter = filterValue as GlobalFilterValue;
  const query = (filter.search ?? "").trim().toLocaleLowerCase();
  const rules = filter.rules ?? [];

  if (query) {
    const matchesSearch = row.getAllCells().some((cell) => {
      if (cell.column.id === "actions") return false;
      return valueToString(cell.getValue()).toLocaleLowerCase().includes(query);
    });
    if (!matchesSearch) return false;
  }

  return rules.every((rule) =>
    compareFilterValues(row.getValue(rule.field), rule),
  );
};

interface UseDataTableProps<TData>
  extends
    Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    enableAdvancedFilter = false,
    shallow = true,
    ...tableProps
  } = props;

  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate() as (opts: {
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
    replace?: boolean;
  }) => Promise<void>;

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    initialState?.columnPinning ?? {},
  );
  const [globalFilter, setGlobalFilter] = React.useState<unknown>(
    initialState?.globalFilter ?? { search: "", rules: [] },
  );

  const page = (search.page as number) ?? 1;
  const perPage = initialState?.pagination?.pageSize ?? 20;

  const pagination: PaginationState = React.useMemo(
    () => ({ pageIndex: page - 1, pageSize: perPage }),
    [page, perPage],
  );

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      const newPagination =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;
      void navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          page: newPagination.pageIndex + 1,
          perPage: newPagination.pageSize,
        }),
        replace: history === "replace",
      });
    },
    [pagination, navigate, history],
  );

  const columnIds = React.useMemo(
    () =>
      new Set(
        columns.flatMap((column) => {
          if (column.id) return [column.id];
          if ("accessorKey" in column && column.accessorKey) {
            return [String(column.accessorKey)];
          }
          return [];
        }),
      ),
    [columns],
  );

  const sorting = React.useMemo(
    () =>
      parseSortingState<TData>(search.sort as string | undefined, columnIds) ??
      initialState?.sorting ??
      [],
    [search.sort, columnIds, initialState?.sorting],
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      void navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          sort:
            newSorting.length > 0
              ? serializeSortingState(newSorting as ExtendedColumnSort<TData>[])
              : undefined,
        }),
        replace: history === "replace",
      });
    },
    [sorting, navigate, history],
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];
    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterValues = React.useMemo(() => {
    if (enableAdvancedFilter) return {};
    const values: Record<string, string | string[] | null> = {};
    for (const column of filterableColumns) {
      const key = column.id ?? "";
      const val = search[key];
      if (val !== undefined && val !== null) {
        values[key] = column.meta?.options
          ? typeof val === "string"
            ? val.split(ARRAY_SEPARATOR)
            : null
          : typeof val === "string"
            ? val
            : null;
      } else {
        values[key] = null;
      }
    }
    return values;
  }, [search, filterableColumns, enableAdvancedFilter]);

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: Record<string, string | string[] | null>) => {
      void navigate({
        search: (prev: Record<string, unknown>) => {
          const next: Record<string, unknown> = { ...prev, page: 1 };
          for (const [key, value] of Object.entries(values)) {
            if (value === null || value === undefined) delete next[key];
            else if (Array.isArray(value))
              next[key] = value.join(ARRAY_SEPARATOR);
            else next[key] = value;
          }
          return next;
        },
        replace: history === "replace",
      });
    },
    debounceMs,
  );

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];
    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          const processedValue = Array.isArray(value)
            ? value
            : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
              ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
              : [value];
          filters.push({ id: key, value: processedValue });
        }
        return filters;
      },
      [],
    );
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;
      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;
        const filterUpdates: Record<string, string | string[] | null> = {};
        for (const filter of next) {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            filterUpdates[filter.id] = filter.value as string | string[];
          }
        }
        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }
        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter],
  );

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      columnPinning,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    globalFilterFn: doctypeGlobalFilter as FilterFn<TData>,
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: tableProps.defaultColumn?.enableColumnFilter ?? false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
  });

  return { table, shallow, debounceMs, throttleMs: props.throttleMs };
}
