import { queryOptions } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";

// Adjust these imports to match your existing Nodra API utilities.

import { callMethod } from "@/lib/call-method";
import { Brand } from ".";
import { BrandFormValues } from "./form";

export const brandsQueryOptions = () =>
  queryOptions({
    queryKey: ["brands"],
    queryFn: async (): Promise<Brand[]> => {
      const response = await callMethod<{
        documents: Brand[];
        limit: number;
        offset: number;
      }>("document.list", {
        doctype: "Brand",
        limit: 20,
        offset: 0,
      });

      return response.documents;
    },
  });

export async function createBrand(values: BrandFormValues) {
  const result = await callMethod("document.create", {
    doctype: "Brand",
    doc: values,
  });

  await getQueryClient().invalidateQueries({
    queryKey: ["brands"],
  });

  return result;
}
