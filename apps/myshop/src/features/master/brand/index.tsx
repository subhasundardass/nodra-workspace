import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { GlobalToolbar } from "@/components/toolbar";
import { getQueryClient } from "@/lib/query-client";

import { createBrand, brandsQueryOptions } from "./brannd.api";
import { createColumns } from "./columns";
import BrandFormSheet, { type BrandFormValues } from "./form";

export interface Brand {
  name: string;
  title: string;
  brand_type: "Factory" | "Company";
  is_active: boolean;
  description?: string | null;
}

interface BrandListProps {
  brands?: Brand[];
}

export default function BrandList({ brands: _brands = [] }: BrandListProps) {
  const [formOpen, setFormOpen] = React.useState(false);

  const columns = React.useMemo(() => createColumns(), []);
  const { data: brandList } = useSuspenseQuery(brandsQueryOptions());

  const createMutation = useMutation({
    mutationFn: (values: BrandFormValues) => createBrand(values),

    onSuccess: async () => {
      toast.success("Brand created successfully!");

      await getQueryClient().invalidateQueries({
        queryKey: ["brands"],
      });

      setFormOpen(false);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to create brand.");
    },
  });

  const { table } = useDataTable({
    data: brandList,
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

  async function handleCreate(values: BrandFormValues) {
    await createMutation.mutateAsync(values);
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <GlobalToolbar
        title="Brands"
        description="Manage brands associated with tea lots."
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

      <BrandFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
