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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type DocTypeField = {
  fieldname: string;
  fieldtype: string;
  label: string;
  [attribute: string]: unknown;
};

type DocType = {
  name: string;
  module?: string;
  is_child?: boolean;
  is_submittable?: boolean;
  fields?: DocTypeField[];
};

type Props = {
  doctypes?: DocType[];
};

export default function NodraDocTypes({ doctypes = [] }: Props) {
  const [selectedDocType, setSelectedDocType] = React.useState<DocType | null>(
    null,
  );

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
        id: "fieldsCount",
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
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setSelectedDocType(row.original)}
            >
              Fields
            </Button>
          </div>
        ),
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

  const fields = selectedDocType?.fields ?? [];

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="bg-secondary font-bold text-primary"
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>

            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={selectedDocType !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDocType(null);
        }}
      >
        <DialogContent className="w-[85vw]! max-w-[85vw]! flex h-[85vh] flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedDocType?.name} — Fields</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            {fields.length} fields · All defined field attributes
          </p>

          <div className="min-h-0 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Name</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Attributes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {fields.length ? (
                  fields.map((field, index) => {
                    const { fieldname, label, fieldtype, ...attributes } =
                      field;

                    return (
                      <TableRow key={`${fieldname}-${index}`}>
                        <TableCell className="whitespace-nowrap font-medium">
                          {fieldname}
                        </TableCell>
                        <TableCell>{label}</TableCell>
                        <TableCell>{fieldtype}</TableCell>
                        <TableCell className="min-w-70">
                          {Object.keys(attributes).length ? (
                            <pre className="whitespace-pre-wrap wrap-break-word text-xs">
                              {JSON.stringify(attributes, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No fields defined for this DocType.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
