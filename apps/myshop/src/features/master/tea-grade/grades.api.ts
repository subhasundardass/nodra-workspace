import { queryOptions } from "@tanstack/react-query";

import type { TeaGrade } from "./columns";
import { callMethod } from "@/lib/call-method";
import { TeaGradeFormValues } from "./form";

interface GradesListResponse {
  data: TeaGrade[];
  meta: {
    total_count: number;
    limit: number;
    offset: number;
  };
}

// Queries
export const gradesQueryOptions = () =>
  queryOptions({
    queryKey: ["grades"],
    queryFn: async (): Promise<TeaGrade[]> => {
      const response = await callMethod<GradesListResponse>("grades.list", {});

      return response.data;
    },
  });

// Mutations
export const createGrade = (values: TeaGradeFormValues) =>
  callMethod("grades.create", {
    data: values,
  });
