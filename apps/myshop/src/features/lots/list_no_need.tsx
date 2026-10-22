import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import type { DocTypeDefinition } from "nodra";

import { DocTypeFormTemplate } from "@/components/doctype/templates/doctype-form-template";
import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";
import { callMethod } from "@/lib/call-method";
import { LotForm } from "./form";

export type LotRecord = Record<string, unknown> & {
  name: string;
};

type LotListProps = {
  doctype: DocTypeDefinition;
  records: LotRecord[];
};

type FormValues = Record<string, unknown>;

type SaveVariables = {
  name?: string;
  values: FormValues;
};

export default function LotList({ doctype, records }: LotListProps) {
  const router = useRouter();

  const [editingLot, setEditingLot] = React.useState<LotRecord | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);

  const saveMutation = useMutation({
    mutationFn: ({ name, values }: SaveVariables) =>
      name
        ? callMethod("document.update", {
            doctype: doctype.name,
            name,
            doc: values,
          })
        : callMethod("document.create", {
            doctype: doctype.name,
            doc: values,
          }),

    onSuccess: async (_result, variables) => {
      toast.success(
        variables.name
          ? "Lot updated successfully."
          : "Lot created successfully.",
      );

      setFormOpen(false);
      setEditingLot(null);

      await router.invalidate();
    },

    onError: (error: Error) => {
      toast.error(error.message || "Unable to save lot.");
    },
  });

  const openCreateForm = () => {
    setEditingLot(null);
    setFormOpen(true);
  };

  const openEditForm = (name: string) => {
    const lot = records.find((record) => record.name === name);

    if (!lot) {
      toast.error("Lot not found.");
      return;
    }

    setEditingLot(lot);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saveMutation.isPending) return;

    setFormOpen(false);
    setEditingLot(null);
  };

  const handleSubmit = async (values: FormValues): Promise<void> => {
    await saveMutation.mutateAsync({
      name: editingLot?.name,
      values,
    });
  };

  if (formOpen) {
    return (
      <DocTypeFormTemplate
        doctype={doctype}
        mode={editingLot ? "edit" : "create"}
        initialValues={editingLot ?? {}}
        saving={saveMutation.isPending}
        onSubmit={handleSubmit}
        onCancel={closeForm}
      >
        {(form) => <LotForm form={form} />}
      </DocTypeFormTemplate>
    );
  }

  return (
    <DocTypeListTemplate
      doctype={doctype}
      records={records}
      title="Lots"
      onCreate={openCreateForm}
      onOpen={openEditForm}
    />
  );
}
