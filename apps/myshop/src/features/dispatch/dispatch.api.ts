// import { queryOptions } from "@tanstack/react-query";
// import { getQueryClient } from "@/lib/query-client";
// import { callMethod } from "@/lib/call-method";

// export type DispatchRow = {
//   name: string;
//   sale_book: string;
//   dispatch_date: string;

//   party: string;
//   broker: string | null;
//   transporter: string | null;

//   lr_number: string | null;
//   challan_number: string | null;

//   total_bags: number;
//   total_kgs: number;

//   remarks: string | null;
//   workflow_state: "Draft" | "Confirmed" | "Cancelled";
// };

// type DispatchListResponse = {
//   documents: DispatchRow[];
//   limit: number;
//   offset: number;
// };

// export type DispatchListParams = {
//   limit?: number;
//   offset?: number;
// };

// export const dispatchQueryOptions = (params: DispatchListParams = {}) =>
//   queryOptions({
//     queryKey: ["dispatch", params],
//     queryFn: async (): Promise<DispatchRow[]> => {
//       const response = await callMethod<DispatchListResponse>(
//         "dispatch.get_list",
//         {
//           limit: params.limit ?? 100,
//           offset: params.offset ?? 0,
//         },
//       );

//       return response.documents;
//     },
//   });

// export async function refreshDispatch() {
//   await getQueryClient().invalidateQueries({
//     queryKey: ["dispatch"],
//   });
// }
