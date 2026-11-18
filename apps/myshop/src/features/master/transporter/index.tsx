import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { GlobalToolbar } from "@/components/toolbar";
import { getQueryClient } from "@/lib/query-client";

import { createTransporter, transportersQueryOptions } from "./transporter.api";
import { createColumns } from "./columns";
import TransporterFormSheet, { type TransporterFormValues } from "./form";

export default function TransporterList() {
  const [formOpen, setFormOpen] = React.useState(false);

  const columns = React.useMemo(() => createColumns(), []);

  const { data: transporterList } = useSuspenseQuery(
    transportersQueryOptions(),
  );

  const createMutation = useMutation({
    mutationFn: (values: TransporterFormValues) => createTransporter(values),

    onSuccess: async () => {
      toast.success("Transporter created successfully!");

      await getQueryClient().invalidateQueries({
        queryKey: ["transporters"],
      });

      setFormOpen(false);
    },

    onError: (error) => {
      toast.error(error.message || "Failed to create transporter.");
    },
  });

  const { table } = useDataTable({
    data: transporterList,
    columns,
    pageCount: 1,
    shallow: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
      columnVisibility: {
        name: false,
      },
    },
  });

  async function handleCreate(values: TransporterFormValues) {
    await createMutation.mutateAsync(values);
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <GlobalToolbar
        title="Transporters"
        description="Manage transporters for tea dispatch."
        actions={[
          {
            id: "create",
            label: "Create New",
            icon: Plus,
            variant: "default",
            onClick: () => setFormOpen(true),
          },
        ]}
      />

      <DataTable table={table} />

      <TransporterFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
