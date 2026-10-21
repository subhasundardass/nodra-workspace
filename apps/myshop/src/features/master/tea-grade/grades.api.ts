import { queryOptions } from "@tanstack/react-query";

import { callMethod } from "@/lib/call-method";
import type { TeaGrade } from "./columns";
import type { TeaGradeFormValues } from "./form";

interface GradesListResponse {
  documents: TeaGrade[];
  limit: number;
  offset: number;
}

export const gradesQueryOptions = () =>
  queryOptions({
    queryKey: ["grades"],
    queryFn: async (): Promise<TeaGrade[]> => {
      const response = await callMethod<GradesListResponse>("document.list", {
        doctype: "Grades",
        limit: 20,
        offset: 0,
      });

      return response.documents;
    },
  });

export const createGrade = (values: TeaGradeFormValues) =>
  callMethod("document.create", {
    doctype: "Grades",
    doc: values,
  });
