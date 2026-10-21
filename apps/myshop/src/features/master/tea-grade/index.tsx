import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { GlobalToolbar } from "@/components/toolbar/global-toolbar";
import { getQueryClient } from "@/lib/query-client";

import { createGrade, gradesQueryOptions } from "./grades.api";
import { createColumns, type TeaGrade } from "./columns";
import GradeFormSheet, { type TeaGradeFormValues } from "./form";

export default function GradeList() {
  const [formOpen, setFormOpen] = React.useState(false);

  const columns = React.useMemo(() => createColumns(), []);
  const { data: gradeList } = useSuspenseQuery(gradesQueryOptions());

  const createMutation = useMutation({
    mutationFn: (values: TeaGradeFormValues) => createGrade(values),

    onSuccess: async () => {
      await getQueryClient().invalidateQueries({
        queryKey: ["grades"],
      });

      toast.success("Tea grade created successfully!");
      setFormOpen(false);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to create tea grade.");
    },
  });

  const { table } = useDataTable({
    data: gradeList,
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

  const handleCreate = React.useCallback(
    async (values: TeaGradeFormValues) => {
      await createMutation.mutateAsync(values);
    },
    [createMutation],
  );

  return (
    <div className="flex flex-1 flex-col gap-2">
      <GlobalToolbar
        title="Tea Grades"
        description="Manage grades used in tea testing and valuation."

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

      <GradeFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}
