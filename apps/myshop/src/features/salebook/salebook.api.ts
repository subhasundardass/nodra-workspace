import { queryOptions } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";
import { callMethod } from "@/lib/call-method";

export type SaleBookRow = {
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
  arrival_date: string | null;

  tea_testing: string | null;
  tested_grade: string | null;
  test_information: string | null;
  tf: string | null;

  offer: string | null;
  asking_price: number;

  sale_type: "Bid" | "Advance" | null;
  rate: number;
  broker: string | null;
};

type SaleBookListResponse = {
  documents: SaleBookRow[];
  limit: number;
  offset: number;
};

export type SaleBookListParams = {
  limit?: number;
  offset?: number;
};

export const saleBookQueryOptions = (params: SaleBookListParams = {}) =>
  queryOptions({
    queryKey: ["sale-book", params],
    queryFn: async (): Promise<SaleBookRow[]> => {
      const response = await callMethod<SaleBookListResponse>(
        "salebook.get_list",
        {
          limit: params.limit ?? 100,
          offset: params.offset ?? 0,
        },
      );

      return response.documents;
    },
  });

export async function refreshSaleBook() {
  await getQueryClient().invalidateQueries({
    queryKey: ["sale-book"],
  });
}
