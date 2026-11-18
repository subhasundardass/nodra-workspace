import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { GlobalToolbar } from "@/components/toolbar";
import { getQueryClient } from "@/lib/query-client";

import { createFactory, factoriesQueryOptions } from "./factory.api";
import { createColumns, type Factory } from "./columns";
import FactoryFormSheet, { type FactoryFormValues } from "./form";

interface FactoryListProps {
  factories?: Factory[];
}

export default function FactoryList({ factories = [] }: FactoryListProps) {
  const [formOpen, setFormOpen] = React.useState(false);

  const columns = React.useMemo(() => createColumns(), []);

  const { data: factoryList } = useSuspenseQuery(factoriesQueryOptions());

  const createMutation = useMutation({
    mutationFn: (values: FactoryFormValues) => createFactory(values),

    onSuccess: async () => {
      toast.success("Factory created successfully!");

      await getQueryClient().invalidateQueries({
        queryKey: ["factories"],
      });

      setFormOpen(false);
    },

    onError: (error) => {
      toast.error(error.message || "Failed to create factory.");
    },
  });

  const { table } = useDataTable({
    data: factoryList,
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

  async function handleCreate(values: FactoryFormValues) {
    await createMutation.mutateAsync(values);
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <GlobalToolbar
        title="Factories"
        description="Manage factories associated with tea lots."
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

      <FactoryFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
