import { useEffect, useMemo, useRef, useState } from "react";
import type { Table } from "@tanstack/react-table";
import { Download, Filter, RotateCcw, Search, X, Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FilterOperator =
  | "contains"
  | "equals"
  | "not_equals"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_set";

type FilterRule = {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
};

type GlobalFilterValue = {
  search: string;
  rules: FilterRule[];
};

export type DocTypeListToolbarProps<TData> = {
  table: Table<TData>;
  doctypeName: string;
  onRefresh?: () => void;
  loading?: boolean;
};

const operators: {
  value: FilterOperator;
  label: string;
  needsValue: boolean;
}[] = [
  { value: "contains", label: "contains", needsValue: true },
  { value: "equals", label: "is", needsValue: true },
  { value: "not_equals", label: "is not", needsValue: true },
  { value: "starts_with", label: "starts with", needsValue: true },
  { value: "ends_with", label: "ends with", needsValue: true },
  { value: "greater_than", label: "is greater than", needsValue: true },
  { value: "less_than", label: "is less than", needsValue: true },
  { value: "is_empty", label: "is empty", needsValue: false },
  { value: "is_set", label: "is set", needsValue: false },
];

function getColumnLabel<TData>(table: Table<TData>, columnId: string) {
  const column = table.getColumn(columnId);
  if (!column) return columnId;
  const metaLabel = column.columnDef.meta?.label;
  if (typeof metaLabel === "string") return metaLabel;
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value) ?? "";
  return String(value);
}

function csvCell(value: unknown): string {
  let text = toText(value);
  // Avoid spreadsheet formula execution when users open exported CSV files.
  if (/^[\s]*[=+@]/.test(text) || /^[\s]*-/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function DocTypeListToolbar<TData>({
  table,
  doctypeName,
  onRefresh,
  loading = false,
}: DocTypeListToolbarProps<TData>) {
  const [search, setSearch] = useState("");
  const [rules, setRules] = useState<FilterRule[]>([]);
  const [field, setField] = useState("");
  const [operator, setOperator] = useState<FilterOperator>("contains");
  const [value, setValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);

  const filterableColumns = useMemo(
    () =>
      table
        .getAllLeafColumns()
        .filter(
          (column) =>
            column.id !== "actions" && typeof column.accessorFn === "function",
        ),
    [table],
  );

  const hideableColumns = useMemo(
    () => filterableColumns.filter((column) => column.getCanHide()),
    [filterableColumns],
  );

  const defaultVisibility = useRef<Record<string, boolean> | null>(null);
  if (defaultVisibility.current === null) {
    defaultVisibility.current = Object.fromEntries(
      table
        .getAllLeafColumns()
        .map((column) => [column.id, column.getIsVisible()]),
    );
  }

  useEffect(() => {
    const globalFilter: GlobalFilterValue = { search, rules };
    table.setGlobalFilter(globalFilter);
    table.setPageIndex(0);
  }, [table, search, rules]);

  // Use the first available column as the default without setting state in an effect.
  const activeField = field || filterableColumns[0]?.id || "";

  // The fallback is safe because the operator list is a non-empty constant.
  const activeOperator =
    operators.find((item) => item.value === operator) ?? operators[0]!;

  function addFilter() {
    if (!activeField) return;
    if (activeOperator.needsValue && !value.trim()) return;

    setRules((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        field: activeField,
        operator,
        value: activeOperator.needsValue ? value.trim() : "",
      },
    ]);
    setValue("");
  }

  function resetView() {
    setSearch("");
    setRules([]);
    setValue("");
    table.setGlobalFilter({
      search: "",
      rules: [],
    } satisfies GlobalFilterValue);
    table.resetColumnFilters();
    table.setColumnVisibility(defaultVisibility.current ?? {});
    table.setPageIndex(0);
  }

  function exportCsv() {
    const columns = table
      .getVisibleLeafColumns()
      .filter(
        (column) =>
          column.id !== "actions" && typeof column.accessorFn === "function",
      );
    const rows = table.getFilteredRowModel().rows;
    const csv = [
      columns
        .map((column) => csvCell(getColumnLabel(table, column.id)))
        .join(","),
      ...rows.map((row) =>
        columns.map((column) => csvCell(row.getValue(column.id))).join(","),
      ),
    ].join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${doctypeName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "records"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3  p-0">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1 xl:max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${doctypeName.toLowerCase()}...`}
            aria-label={`Search ${doctypeName}`}
            className="pl-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Filter className="mr-2 size-4" />
                Filters
                {rules.length > 0 && (
                  <span className="ml-1 rounded bg-muted px-1.5 text-xs">
                    {rules.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[min(22rem,calc(100vw-2rem))] space-y-3"
            >
              <div>
                <p className="font-medium">Add a filter</p>
                <p className="text-xs text-muted-foreground">
                  All active conditions must match.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  className="text-xs font-medium"
                  htmlFor="doctype-filter-field"
                >
                  Field
                </label>
                <select
                  id="doctype-filter-field"
                  value={activeField}
                  onChange={(event) => setField(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {filterableColumns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {getColumnLabel(table, column.id)}
                    </option>
                  ))}
                </select>

                <label
                  className="text-xs font-medium"
                  htmlFor="doctype-filter-operator"
                >
                  Condition
                </label>
                <select
                  id="doctype-filter-operator"
                  value={operator}
                  onChange={(event) =>
                    setOperator(event.target.value as FilterOperator)
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {operators.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                {activeOperator.needsValue && (
                  <Input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Value"
                    aria-label="Filter value"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addFilter();
                    }}
                  />
                )}
                <Button
                  type="button"
                  className="w-full"
                  onClick={addFilter}
                  disabled={
                    !activeField || (activeOperator.needsValue && !value.trim())
                  }
                >
                  Add filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={columnsOpen} onOpenChange={setColumnsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Columns3 className="mr-2 size-4" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-60 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Visible columns</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    table.setColumnVisibility(defaultVisibility.current ?? {})
                  }
                >
                  Defaults
                </Button>
              </div>
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {hideableColumns.map((column) => (
                  <label
                    key={column.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) =>
                        column.toggleVisibility(checked === true)
                      }
                    />
                    <span>{getColumnLabel(table, column.id)}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>

          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RotateCcw className="mr-2 size-4" />
              Refresh
            </Button>
          )}

          {(search || rules.length > 0) && (
            <Button type="button" variant="ghost" size="sm" onClick={resetView}>
              <RotateCcw className="mr-2 size-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {rules.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-none py-1.5">
          {rules.map((rule) => {
            const label = getColumnLabel(table, rule.field);
            const operatorLabel =
              operators.find((item) => item.value === rule.operator)?.label ??
              rule.operator;

            return (
              <span
                key={rule.id}
                className="inline-flex max-w-full items-center gap-1  px-1.5 py-0.5 text-[12px]"
              >
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">{operatorLabel}</span>

                {rule.value && (
                  <span className="max-w-40 truncate">{rule.value}</span>
                )}

                <button
                  type="button"
                  className="ml-0.5 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${label} filter`}
                  onClick={() =>
                    setRules((current) =>
                      current.filter((item) => item.id !== rule.id),
                    )
                  }
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setRules([])}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
