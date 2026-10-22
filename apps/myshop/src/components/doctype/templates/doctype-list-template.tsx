import { useMemo, useState } from "react";
import type { DocTypeDefinition, FieldDefinition } from "nodra";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { GlobalToolbar } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const fields = Array.isArray(doctype?.fields) ? doctype.fields : [];

  const listFields = fields.filter(
    (field) =>
      field.in_list_view && !field.hidden && field.fieldtype !== "Table",
  );

  if (!listFields.some((field) => field.fieldname === "name")) {
    return [
      {
        fieldname: "name",
        label: "ID",
        fieldtype: "Data",
        in_list_view: true,
      },
      ...listFields,
    ];
  }

  return listFields;
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
  const [page, setPage] = useState(0);

  const fields = useMemo(() => getListFields(doctype), [doctype]);
  const safeRecords = Array.isArray(records) ? records : [];

  const query = String(search ?? "")
    .trim()
    .toLowerCase();

  const filteredRecords = safeRecords.filter((record) => {
    if (!query) return true;

    return fields.some((field) => {
      const value = record?.[field.fieldname];

      return String(value ?? "")
        .toLowerCase()
        .includes(query);
    });
  });

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRecords = filteredRecords.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  function handleSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  const canCreate = !doctype.is_single && !doctype.is_child;

  return (
    <PageContainer>
      {/* Page header */}

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

      {/* Table Toolbar */}
      <div className="flex flex-col gap-2 mb-1 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder={`Search ${String(doctype?.name ?? "records").toLowerCase()}...`}
            className="pl-9"
            aria-label={`Search ${doctype?.name ?? "records"}`}
          />
        </div>

        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                {fields.map((field) => (
                  <th
                    key={field.fieldname}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left font-medium"
                  >
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={fields.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Loading records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={fields.length}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Unable to load records.
                  </td>
                </tr>
              ) : pageRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(fields.length, 1)}
                    className="px-4 py-12 text-center"
                  >
                    <p className="font-medium">No records found</p>

                    <p className="mt-1 text-muted-foreground">
                      {search
                        ? "Try another search."
                        : `Create your first ${String(doctype?.name ?? "document").toLowerCase()} record.`}
                    </p>

                    {!search && canCreate && (
                      <Button className="mt-4" onClick={onCreate}>
                        <Plus className="size-4" />
                        Create {doctype?.name ?? "Record"}
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                pageRecords.map((record, index) => {
                  const recordName = record.name;

                  return (
                    <tr
                      key={
                        recordName == null
                          ? `${currentPage}-${index}`
                          : String(recordName)
                      }
                      onClick={() => {
                        if (recordName != null) {
                          onOpen(String(recordName));
                        }
                      }}
                      onKeyDown={(event) => {
                        if (
                          recordName != null &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          onOpen(String(recordName));
                        }
                      }}
                      tabIndex={recordName != null ? 0 : undefined}
                      className={
                        recordName != null
                          ? "cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          : undefined
                      }
                    >
                      {fields.map((field) => (
                        <td
                          key={field.fieldname}
                          className="max-w-xs truncate whitespace-nowrap px-4 py-3"
                          title={getDisplayValue(record[field.fieldname])}
                        >
                          {getDisplayValue(record[field.fieldname])}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredRecords.length === 0
            ? "Showing 0 records"
            : `Showing ${currentPage * pageSize + 1}–${Math.min(
                (currentPage + 1) * pageSize,
                filteredRecords.length,
              )} of ${filteredRecords.length}`}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={currentPage === 0 || loading}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <span className="min-w-20 text-center text-sm">
            Page {currentPage + 1} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((value) => Math.min(totalPages - 1, value + 1))
            }
            disabled={currentPage >= totalPages - 1 || loading}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
