import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { GlobalToolbar } from "@/components/toolbar";
import { getQueryClient } from "@/lib/query-client";

import { createWarehouse, warehousesQueryOptions } from "./warehouse.api";
import { createColumns } from "./columns";
import WarehouseFormSheet, { type WarehouseFormValues } from "./form";

export interface Warehouse {
  name: string;
  title: string;
  factory?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone_no?: string | null;
  email?: string | null;
  manager?: string | null;
  capacity?: number | null;
  is_active: boolean;
}

export default function WarehouseList() {
  const [formOpen, setFormOpen] = React.useState(false);

  const columns = React.useMemo(() => createColumns(), []);
  const { data: warehouseList } = useSuspenseQuery(warehousesQueryOptions());

  const createMutation = useMutation({
    mutationFn: (values: WarehouseFormValues) => createWarehouse(values),

    onSuccess: async () => {
      toast.success("Warehouse created successfully!");

      await getQueryClient().invalidateQueries({
        queryKey: ["warehouses"],
      });

      setFormOpen(false);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to create warehouse.");
    },
  });

  const { table } = useDataTable({
    data: warehouseList,
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

  async function handleCreate(values: WarehouseFormValues) {
    await createMutation.mutateAsync(values);
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <GlobalToolbar
        title="Warehouses"
        description="Manage warehouse locations and storage capacity."
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

      <WarehouseFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
