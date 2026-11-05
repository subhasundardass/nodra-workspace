import { queryOptions } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { callMethod } from "@/lib/call-method";

export type DispatchRow = {
  sale_book: string;
  sale_date: string | null;
  buyer: string | null;

  lot: string;
  lot_no: string;
  factory: string | null;

  original_brand: string | null;
  brand: string | null;

  original_grade: string | null;
  grade: string | null;

  bags: number;
  net_kg_per_bag: number;
  total_kg: number;

  sale_type: "Bid" | "Advance" | null;
  rate: number;
  broker: string | null;
};

type DispatchListResponse = {
  documents: DispatchRow[];
  limit: number;
  offset: number;
};

export type DispatchListParams = {
  limit?: number;
  offset?: number;
};

export const dispatchQueryOptions = (params: DispatchListParams = {}) =>
  queryOptions({
    queryKey: ["dispatch", params],
    queryFn: async (): Promise<DispatchRow[]> => {
      const response = await callMethod<DispatchListResponse>(
        "dispatch.get_list",
        {
          limit: params.limit ?? 100,
          offset: params.offset ?? 0,
        },
      );

      return response.documents;
    },
  });

export async function refreshDispatch() {
  await getQueryClient().invalidateQueries({
    queryKey: ["dispatch"],
  });
}
