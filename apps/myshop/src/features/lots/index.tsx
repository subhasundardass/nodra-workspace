import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { Button } from "@/components/ui/button";
import { getQueryClient } from "@/lib/query-client";
import { callMethod } from "@/lib/call-method";

import {
  lotsQueryKey,
  lotsQueryOptions,
  lotDocTypeQueryOptions,
  type TeaLot,
} from "./lots.api";

import { createColumns } from "./columns";
import { LotForm } from "./form";

type LotFormValues = Record<string, unknown>;

type SaveLotVariables = {
  name?: string;
  values: LotFormValues;
};

export default function LotList() {
  const [editingLot, setEditingLot] = React.useState<TeaLot | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  const queryClient = getQueryClient();

  const { data: lots } = useSuspenseQuery(lotsQueryOptions());
  const { data: doctype } = useSuspenseQuery(lotDocTypeQueryOptions());

  const saveMutation = useMutation({
    mutationFn: async ({ name, values }: SaveLotVariables) => {
      if (name) {
        return callMethod("document.update", {
          doctype: "Lot",
          name,
          doc: values,
        });
      }

      return callMethod("document.create", {
        doctype: "Lot",
        doc: values,
      });
    },

    onSuccess: async (_result, variables) => {
      toast.success(
        variables.name
          ? "Lot updated successfully."
          : "Lot created successfully.",
      );

      await queryClient.invalidateQueries({
        queryKey: lotsQueryKey,
      });

      setFormOpen(false);
      setEditingLot(null);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Unable to save lot.");
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
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  function openCreateForm() {
    setEditingLot(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saveMutation.isPending) return;

    setFormOpen(false);
    setEditingLot(null);
  }

  async function handleSubmit(values: LotFormValues) {
    await saveMutation.mutateAsync({
      name: editingLot?.name,
      values,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {!formOpen ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Lots</h1>

            <Button type="button" onClick={openCreateForm}>
              <Plus className="mr-2 size-4" />
              Create Lot
            </Button>
          </div>

          <DataTable table={table} />
        </>
      ) : (
        <DocTypeFormTemplate
          doctype={doctype}
          mode={editingLot ? "edit" : "create"}
          initialValues={editingLot ? { ...editingLot } : {}}
          saving={saveMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        >
          {(form) => <LotForm form={form} />}
        </DocTypeFormTemplate>
      )}
    </div>
  );
}
