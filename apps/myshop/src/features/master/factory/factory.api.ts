import { queryOptions } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";

// Adjust these imports to match your existing Nodra API utilities.

import type { Factory } from "./columns";
import type { FactoryFormValues } from "./form";
import { callMethod } from "@/lib/call-method";

export const factoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["factories"],
    queryFn: async (): Promise<Factory[]> => {
      const response = await callMethod<{
        documents: Factory[];
        limit: number;
        offset: number;
      }>("document.list", {
        doctype: "Factory",
        limit: 20,
        offset: 0,
      });

      return response.documents;
    },
  });

export async function createFactory(values: FactoryFormValues) {
  const result = await callMethod("document.create", {
    doctype: "Factory",
    doc: values,
  });

  await getQueryClient().invalidateQueries({
    queryKey: ["factories"],
  });

  return result;
}
