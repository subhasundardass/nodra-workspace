import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  SalesOrderForm,
  type SalesOrderFormValues,
  type SalesOrderParty,
  type SalesOrderWarehouse,
} from "@/features/sales-orders/form";
import { callMethod } from "@/lib/call-method";
import PageContainer from "@/components/layout/page-container";

type ListResult<T> = { documents?: T[] };

type SalesOrderMasterData = {
  parties: SalesOrderParty[];
  warehouses: SalesOrderWarehouse[];
};

export const Route = createFileRoute("/dashboard/sales-orders/new")({
  loader: async (): Promise<SalesOrderMasterData> => {
    const [partyResult, warehouseResult] = await Promise.all([
      callMethod<ListResult<SalesOrderParty>>("document.list", {
        doctype: "Party",
        fields: ["name", "title", "is_buyer", "is_active"],
        limit: 100,
        offset: 0,
      }),
      callMethod<ListResult<SalesOrderWarehouse>>("document.list", {
        doctype: "Warehouse",
        fields: ["name", "title", "is_active"],
        limit: 100,
        offset: 0,
      }),
    ]);

    return {
      parties: partyResult.documents ?? [],
      warehouses: warehouseResult.documents ?? [],
    };
  },
  component: CreateSalesOrderRoute,
});

function CreateSalesOrderRoute() {
  const { parties, warehouses } = Route.useLoaderData();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: SalesOrderFormValues): Promise<void> {
    setSaving(true);

    try {
      const items = values.items.map((item) => ({
        lot: item.lot,
        grade: item.grade,
        available_bags: item.available_bags,
        ordered_bags: item.ordered_bags,
        net_kg_per_bag: item.net_kg_per_bag,
        total_weight_kg: item.total_weight_kg,
        rate_per_kg: item.rate_per_kg,
        total_amount: item.total_amount,
      }));

      await callMethod("document.create", {
        doctype: "SalesOrder",
        doc: {
          order_date: values.order_date,
          warehouse: values.warehouse,
          party: values.party,
          sales_channel: values.sales_channel,
          items,
          total_bags: items.reduce(
            (total, item) => total + Number(item.ordered_bags || 0),
            0,
          ),
          total_weight_kg: items.reduce(
            (total, item) => total + Number(item.total_weight_kg || 0),
            0,
          ),
          total_amount: items.reduce(
            (total, item) => total + Number(item.total_amount || 0),
            0,
          ),
          payment_terms: values.payment_terms,
          delivery_date: values.delivery_date || null,
          delivery_address: values.delivery_address,
          remarks: values.remarks,
          workflow_state: "Draft",
        },
      });

      toast.success("Sales Order saved as draft.");
      await navigate({ to: "/dashboard/sales-orders" });
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Unable to save Sales Order.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <SalesOrderForm
        parties={parties}
        warehouses={warehouses}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/dashboard/sales-orders" })}
      />
    </PageContainer>
  );
}
