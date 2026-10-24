import { useMemo } from "react";
import type { ReactNode } from "react";
import type { ColumnDef, Table } from "@tanstack/react-table";
import type { DocTypeDefinition } from "nodra";
import { Plus } from "lucide-react";

import { GlobalToolbar } from "@/components/toolbar";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table/data-table";
import { DocTypeListToolbar } from "@/components/doctype/list/doctype-list-toolbar";
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
  /** Pass this when rendering a custom DataTable so the global toolbar controls it. */
  table?: Table<TRecord>;
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
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value) ?? "—";
  return String(value);
}

function getListFields(doctype: DocTypeDefinition) {
  const fields = (doctype.fields ?? []).filter(
    (field) =>
      field.in_list_view && !field.hidden && field.fieldtype !== "Table",
  );

  if (fields.some((field) => field.fieldname === "name")) return fields;

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
  table: suppliedTable,
  children,
  title,
  description,
  actions,
  loading = false,
  error = null,
  onCreate,
  onOpen,
  onRefresh,
  pageSize = 20,
}: DocTypeListTemplateProps<TRecord>) {
  const fields = useMemo<DocTypeListColumn[]>(() => {
    if (customColumns !== undefined) return customColumns;

    return getListFields(doctype).map((field) => ({
      id: field.fieldname,
      fieldname: field.fieldname,
      label: field.label || field.fieldname,
      searchable: true,
      sortable: true,
    }));
  }, [customColumns, doctype]);

  const canCreate = !doctype.is_single && !doctype.is_child;

  const tableColumns = useMemo<ColumnDef<TRecord>[]>(
    () =>
      fields.map((field) => ({
        id: field.id,
        accessorFn: field.fieldname
          ? (record) => toDocumentRow(record)[field.fieldname!]
          : undefined,
        header: field.label,
        enableSorting: field.sortable ?? Boolean(field.fieldname),
        enableHiding: field.fieldname !== "name",
        cell: ({ row }) => {
          const record = row.original;
          const document = toDocumentRow(record);

          if (field.render) return field.render(document);

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

  const internalTableResult = useDataTable({
    data: records,
    columns: tableColumns,
    pageCount: Math.max(1, Math.ceil(records.length / pageSize)),
    initialState: {
      pagination: { pageIndex: 0, pageSize },
    },
  });
  const table = suppliedTable ?? internalTableResult.table;
  const visibleRecordCount = table.getFilteredRowModel().rows.length;

  const toolbarActions = useMemo<GlobalToolbarAction[]>(() => {
    if (actions !== undefined) return actions;
    if (!canCreate || !onCreate) return [];

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

  return (
    <PageContainer>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <GlobalToolbar
          title={title ?? doctype.name}
          description={
            description ??
            `${visibleRecordCount} ${visibleRecordCount === 1 ? "record" : "records"}`
          }
          actions={toolbarActions}
        />

        <DocTypeListToolbar
          table={table}
          doctypeName={title ?? doctype.name}
          onRefresh={onRefresh}
          loading={loading}
        />

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
        ) : table.getRowModel().rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="font-medium">No records found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first {doctype.name.toLowerCase()} record or adjust
              the filters.
            </p>

            {canCreate && onCreate && (
              <Button type="button" className="mt-4" onClick={onCreate}>
                <Plus className="mr-2 size-4" />
                Create {doctype.name}
              </Button>
            )}
          </div>
        ) : children !== undefined ? (
          children
        ) : (
          <DataTable table={table} />
        )}
      </div>
    </PageContainer>
  );
}

export default DocTypeListTemplate;
