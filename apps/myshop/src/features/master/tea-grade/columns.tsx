import type { ColumnDef } from "@tanstack/react-table";

export interface TeaGrade {
  name: string;
  grade_code: string;
  description: string;
  is_active: boolean;
}

export function createColumns(): ColumnDef<TeaGrade>[] {
  return [
    {
      accessorKey: "name",
      header: "ID",
      enableHiding: true,
      enableSorting: true,
    },
    {
      accessorKey: "grade_code",
      header: "Code",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono font-bold">{row.original.grade_code}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header: () => <div className="text-right">Status</div>,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right">
          <span
            className={
              row.original.is_active
                ? "font-medium text-green-600"
                : "font-medium text-muted-foreground"
            }
          >
            {row.original.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
  ];
}
