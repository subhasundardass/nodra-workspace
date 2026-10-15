import * as React from "react";
import { Plus } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/ui/table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { GlobalToolbar } from "@/components/global-toolbar";
import { getQueryClient } from "@/lib/query-client";
import { createGrade, gradesQueryOptions } from "./grades.api";
import { createColumns, type TeaGrade } from "./columns";
import GradeFormSheet, { type TeaGradeFormValues } from "./form";
import { toast } from "sonner";

interface GradeListProps {
  grades?: TeaGrade[];
}

export default function GradeList({ grades = [] }: GradeListProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const columns = React.useMemo(() => createColumns(), []);
  const { data: gradeList } = useSuspenseQuery(gradesQueryOptions());

  const createMutation = useMutation({
    mutationFn: (values: TeaGradeFormValues) => createGrade(values),
    onSuccess: async () => {
      toast.success("Tea grade created successfully!");
      await getQueryClient().invalidateQueries({
        queryKey: ["grades"],
      });
      setFormOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create tea grade.");
    },
  });

  const { table } = useDataTable({
    data: gradeList,
    columns,
    pageCount: 1,
    shallow: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
      columnVisibility: {
        name: false,
      },
    },
  });

  async function handleCreate(values: TeaGradeFormValues) {
    await createMutation.mutateAsync(values);
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <GlobalToolbar
        title="Tea Grades"
        description="Manage grades used in tea testing and valuation."
        breadcrumbs={[
          { label: "Masters", href: "/dashboard/master" },
          { label: "Tea Grades" },
        ]}
        view="list"
        views={["list"]}
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
