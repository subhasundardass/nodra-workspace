import { queryOptions } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";
import { callMethod } from "@/lib/call-method";

import type { Transporter } from "./columns";
import type { TransporterFormValues } from "./form";

export const transportersQueryOptions = () =>
  queryOptions({
    queryKey: ["transporters"],
    queryFn: async (): Promise<Transporter[]> => {
      const response = await callMethod<{
        documents: Transporter[];
        limit: number;
        offset: number;
      }>("document.list", {
        doctype: "Transporter",
        limit: 20,
        offset: 0,
      });

      return response.documents;
    },
  });

export async function createTransporter(values: TransporterFormValues) {
  const result = await callMethod("document.create", {
    doctype: "Transporter",
    doc: values,
  });

  await getQueryClient().invalidateQueries({
    queryKey: ["transporters"],
  });

  return result;
}
