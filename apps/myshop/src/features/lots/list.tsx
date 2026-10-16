import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DocTypeDefinition } from "nodra";
import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { GlobalToolbar } from "@/components/global-toolbar";
import { getQueryClient } from "@/lib/query-client";

import {
  createLot,
  updateLot,
  lotsQueryKey,
  lotsQueryOptions,
  lotDocTypeQueryOptions,
  type TeaLot,
  type TeaLotFormValues,
} from "./lots.api";

import { createColumns } from "./columns";
import { LotForm } from "./form";

export default function LotList() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingLot, setEditingLot] = React.useState<TeaLot | null>(null);

  const { data: lots } = useSuspenseQuery(lotsQueryOptions());
  const { data: doctype } = useSuspenseQuery(lotDocTypeQueryOptions());

  const saveMutation = useMutation({
    mutationFn: async ({
      name,
      values,
    }: {
      name?: string;
      values: TeaLotFormValues;
    }) => {
      return name ? updateLot(name, values) : createLot(values);
    },

    onSuccess: async () => {
      toast.success(
        editingLot ? "Lot updated successfully!" : "Lot created successfully!",
      );

      await getQueryClient().invalidateQueries({
        queryKey: lotsQueryKey,
      });

      setFormOpen(false);
      setEditingLot(null);
    },

    onError: (error) => {
      toast.error(error.message || "Failed to save lot.");
    },
  });

  const columns = React.useMemo(
    () =>
      createColumns((lot) => {
        setEditingLot(lot);
        setFormOpen(true);
      }),
    [],
  );

  const { table } = useDataTable({
    data: lots,
    columns,
    pageCount: 1,
    shallow: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  async function handleSubmit(values: TeaLotFormValues) {
    await saveMutation.mutateAsync({
      name: editingLot?.name,
      values,
    });
  }

  function openCreateForm() {
    setEditingLot(null);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <DataTable table={table} />

      {formOpen && (
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingLot ? "Edit Lot" : "Create Lot"}
            </h2>

            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setFormOpen(false);
                setEditingLot(null);
              }}
            >
              Cancel
            </button>
          </div>

          <LotForm
            doctype={doctype}
            mode={editingLot ? "edit" : "create"}
            initialValues={
              editingLot
                ? { name: editingLot.name, title: editingLot.title }
                : {}
            }
            onSubmit={async (values) => {
              await handleSubmit(values as TeaLotFormValues);
            }}
          />
        </div>
      )}
    </div>
  );
}
