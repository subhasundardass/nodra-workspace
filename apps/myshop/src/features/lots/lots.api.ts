import { queryOptions } from "@tanstack/react-query";
import type { DocTypeDefinition } from "nodra";

import { callMethod } from "@/lib/call-method";

export interface TeaLot {
  name: string;
  factory: string;
  entry_date: string;
  lot_no: string;
  grade?: string | null;
  original_brand?: string | null;
  bags: number;
  net_kg_per_bag: number;
  workflow_state?: string | null;
}

export type TeaLotFormValues = Pick<
  TeaLot,
  | "factory"
  | "entry_date"
  | "lot_no"
  | "grade"
  | "original_brand"
  | "bags"
  | "net_kg_per_bag"
>;

const LOT_DOCTYPE = "Lots";

export const lotsQueryKey = ["lots"] as const;

export const lotsQueryOptions = () =>
  queryOptions({
    queryKey: lotsQueryKey,
    queryFn: async () => {
      const result = await callMethod<{
        documents: TeaLot[];
      }>("document.list", {
        doctype: "Lots",
      });

      return result.documents;
    },
  });

export const lotDocTypeQueryOptions = () =>
  queryOptions({
    queryKey: ["nodra", "doctype", LOT_DOCTYPE],
    queryFn: async () => {
      const result = (await callMethod("nodra.doctypes")) as {
        doctypes: DocTypeDefinition[];
      };

      const doctype = result.doctypes.find((item) => item.name === LOT_DOCTYPE);

      if (!doctype) {
        throw new Error(
          `DocType "${LOT_DOCTYPE}" was not found in Nodra registry.`,
        );
      }

      return doctype;
    },
  });

export const createLot = (values: TeaLotFormValues) =>
  callMethod("document.create", {
    doctype: "Lots",
    doc: values,
  });

export const updateLot = (name: string, values: TeaLotFormValues) =>
  callMethod("document.update", {
    doctype: "Lots",
    name,
    doc: values,
  });
