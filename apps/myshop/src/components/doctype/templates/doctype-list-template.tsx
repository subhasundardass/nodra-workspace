import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { DocTypeDefinition } from "nodra";
import { Plus, Search } from "lucide-react";

import { GlobalToolbar } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import PageContainer from "@/components/layout/page-container";

type DocumentRow = Record<string, unknown>;

type DocTypeListTemplateProps = {
  doctype: DocTypeDefinition;
  records: DocumentRow[];
  loading?: boolean;
  error?: string | null;
  onCreate: () => void;
  onOpen: (name: string) => void;
  onRefresh?: () => void;
  pageSize?: number;
};

function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
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

export function DocTypeListTemplate({
  doctype,
  records,
  loading = false,
  error = null,
  onCreate,
  onOpen,
  onRefresh,
  pageSize = 10,
}: DocTypeListTemplateProps) {
  const [search, setSearch] = useState("");

  const fields = useMemo(() => getListFields(doctype), [doctype]);
  const canCreate = !doctype.is_single && !doctype.is_child;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      fields.some((field) =>
        String(record[field.fieldname] ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [records, fields, search]);

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () =>
      fields.map((field) => ({
        id: field.fieldname,
        accessorFn: (row) => row[field.fieldname],
        header: field.label || field.fieldname,
        enableSorting: true,
        cell: ({ row }) => {
          const value = row.original[field.fieldname];
          const recordName = row.original.name;

          if (field.fieldname === "name" && recordName != null) {
            return (
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => onOpen(String(recordName))}
              >
                {getDisplayValue(value)}
              </button>
            );
          }

          return getDisplayValue(value);
        },
      })),
    [fields, onOpen],
  );

  const { table } = useDataTable({
    data: filteredRecords,
    columns,
    pageCount: Math.max(1, Math.ceil(filteredRecords.length / pageSize)),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  return (
    <PageContainer>
      <GlobalToolbar
        title={doctype.name}
        description={`${filteredRecords.length} ${
          filteredRecords.length === 1 ? "record" : "records"
        }`}
        actions={
          canCreate
            ? [
                {
                  id: "create",
                  label: `Create ${doctype.name}`,
                  icon: Plus,
                  variant: "default",
                  onClick: onCreate,
                },
              ]
            : []
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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

              {!search && canCreate && (
                <Button type="button" className="mt-4" onClick={onCreate}>
                  <Plus className="mr-2 size-4" />
                  Create {doctype.name}
                </Button>
              )}
            </div>
          )}
        </DataTable>
      )}
    </PageContainer>
  );
}
