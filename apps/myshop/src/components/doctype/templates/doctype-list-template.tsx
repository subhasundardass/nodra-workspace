import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DocTypeDefinition } from "nodra";
import { Plus, Search } from "lucide-react";

import { GlobalToolbar } from "@/components/toolbar";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import PageContainer from "@/components/layout/page-container";

type DocumentRow = Record<string, unknown>;

export type DocTypeListColumn = {
  id: string;
  label: string;
  fieldname?: string;
  searchable?: boolean;
  sortable?: boolean;
  render?: (record: DocumentRow) => ReactNode;
};

export type DocTypeListTemplateProps<TRecord extends object> = {
  doctype: DocTypeDefinition;
  records?: TRecord[];
  columns?: DocTypeListColumn[];
  children?: ReactNode;

  title?: string;
  description?: string;
  actions?: GlobalToolbarAction[];

  loading?: boolean;
  error?: string | null;
  onCreate?: () => void;
  onOpen?: (name: string) => void;
  onRefresh?: () => void;
  pageSize?: number;
};

function toDocumentRow(record: object): DocumentRow {
  return record as DocumentRow;
}

function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value) ?? "—";
  }

  return String(value);
}

function getListFields(doctype: DocTypeDefinition) {
  const fields = (doctype.fields ?? []).filter(
    (field) =>
      field.in_list_view && !field.hidden && field.fieldtype !== "Table",
  );

  if (fields.some((field) => field.fieldname === "name")) {
    return fields;
  }

  return [
    {
      fieldname: "name",
      label: "ID",
      fieldtype: "Data",
      in_list_view: true,
    },
    ...fields,
  ];
}

export function DocTypeListTemplate<TRecord extends object>({
  doctype,
  records = [],
  columns: customColumns,
  children,
  title,
  description,
  actions,
  loading = false,
  error = null,
  onCreate,
  onOpen,
  onRefresh,
  pageSize = 10,
}: DocTypeListTemplateProps<TRecord>) {
  const [search, setSearch] = useState("");

  const fields = useMemo<DocTypeListColumn[]>(() => {
    if (customColumns !== undefined) {
      return customColumns;
    }

    return getListFields(doctype).map((field) => ({
      id: field.fieldname,
      fieldname: field.fieldname,
      label: field.label || field.fieldname,
      searchable: true,
      sortable: true,
    }));
  }, [customColumns, doctype]);

  const canCreate = !doctype.is_single && !doctype.is_child;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      const row = toDocumentRow(record);

      return fields.some((field) => {
        if (!field.fieldname || field.searchable === false) {
          return false;
        }

        return String(row[field.fieldname] ?? "")
          .toLowerCase()
          .includes(query);
      });
    });
  }, [records, fields, search]);

  const tableColumns = useMemo<ColumnDef<TRecord>[]>(
    () =>
      fields.map((field) => ({
        id: field.id,
        accessorFn: field.fieldname
          ? (record) => toDocumentRow(record)[field.fieldname!]
          : undefined,
        header: field.label,
        enableSorting: field.sortable ?? Boolean(field.fieldname),
        cell: ({ row }) => {
          const record = row.original;
          const document = toDocumentRow(record);

          if (field.render) {
            return field.render(document);
          }

          const value = field.fieldname ? document[field.fieldname] : undefined;

          if (field.fieldname === "name" && document.name != null) {
            return onOpen ? (
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(String(document.name));
                }}
              >
                {getDisplayValue(value)}
              </button>
            ) : (
              getDisplayValue(value)
            );
          }

          return getDisplayValue(value);
        },
      })),
    [fields, onOpen],
  );

  const { table } = useDataTable({
    data: filteredRecords,
    columns: tableColumns,
    pageCount: Math.max(1, Math.ceil(filteredRecords.length / pageSize)),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  const toolbarActions = useMemo<GlobalToolbarAction[]>(() => {
    if (actions !== undefined) {
      return actions;
    }

    if (!canCreate || !onCreate) {
      return [];
    }

    return [
      {
        id: "create",
        label: `Create ${doctype.name}`,
        icon: Plus,
        variant: "default",
        onClick: onCreate,
      },
    ];
  }, [actions, canCreate, doctype.name, onCreate]);

  function handleSearch(value: string) {
    setSearch(value);
    table.setPageIndex(0);
  }

  return (
    <PageContainer>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <GlobalToolbar
          title={title ?? doctype.name}
          description={
            description ??
            `${filteredRecords.length} ${
              filteredRecords.length === 1 ? "record" : "records"
            }`
          }
          actions={toolbarActions}
        />

        {children !== undefined ? (
          children
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder={`Search ${doctype.name.toLowerCase()}...`}
                  className="pl-9"
                  aria-label={`Search ${doctype.name}`}
                />
              </div>

              {onRefresh && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-lg border px-4 py-12 text-center text-sm text-muted-foreground">
                Loading records...
              </div>
            ) : error ? (
              <div className="rounded-lg border px-4 py-12 text-center text-sm text-muted-foreground">
                Unable to load records.
              </div>
            ) : (
              <DataTable table={table}>
                {table.getRowModel().rows.length === 0 && (
                  <div className="rounded-md border border-dashed p-8 text-center">
                    <p className="font-medium">No records found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {search
                        ? "Try another search."
                        : `Create your first ${doctype.name.toLowerCase()} record.`}
                    </p>

                    {!search && canCreate && onCreate && (
                      <Button type="button" className="mt-4" onClick={onCreate}>
                        <Plus className="mr-2 size-4" />
                        Create {doctype.name}
                      </Button>
                    )}
                  </div>
                )}
              </DataTable>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default DocTypeListTemplate;
