import { queryOptions } from "@tanstack/react-query";

import { callMethod } from "@/lib/call-method";
import type { Warehouse } from "./columns";
import type { WarehouseFormValues } from "./form";

interface WarehousesListResponse {
  documents: Warehouse[];
  limit: number;
  offset: number;
}

export const warehousesQueryOptions = () =>
  queryOptions({
    queryKey: ["warehouses"],
    queryFn: async (): Promise<Warehouse[]> => {
      const response = await callMethod<WarehousesListResponse>(
        "document.list",
        {
          doctype: "Warehouse",
          limit: 20,
          offset: 0,
        },
      );

      return response.documents;
    },
  });

export const createWarehouse = (values: WarehouseFormValues) =>
  callMethod("document.create", {
    doctype: "Warehouse",
    doc: values,
  });
