import { queryOptions } from "@tanstack/react-query";
import type { DocTypeDefinition } from "nodra";

import { callMethod } from "@/lib/call-method";

export interface TeaLot {
  name: string;
  title: string;
}

export type TeaLotFormValues = Pick<TeaLot, "title">;

export const lotsQueryKey = ["lots"] as const;

export const lotsQueryOptions = () =>
  queryOptions({
    queryKey: lotsQueryKey,
    queryFn: async () => {
      const result = (await callMethod("lots.list")) as {
        data: TeaLot[];
      };

      return result.data;
    },
  });

export const lotDocTypeQueryOptions = () =>
  queryOptions({
    queryKey: ["nodra", "doctype", "Lot"],
    queryFn: async () => {
      const result = (await callMethod("debug.doctypes")) as {
        doctypes: DocTypeDefinition[];
      };

      const doctype = result.doctypes.find((item) => item.name === "Lot");

      if (!doctype) {
        throw new Error('DocType "Lot" was not found in Nodra registry.');
      }

      return doctype;
    },
  });

export const createLot = (values: TeaLotFormValues) =>
  callMethod("lots.create", { data: values });

export const updateLot = (name: string, values: TeaLotFormValues) =>
  callMethod("lots.update", {
    name,
    data: values,
  });
