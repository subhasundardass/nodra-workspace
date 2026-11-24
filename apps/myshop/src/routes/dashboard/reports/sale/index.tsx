import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";
import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";

import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";
import { Printer } from "lucide-react";

import { SaleReportFilter } from "@/features/reports/sale/sale-report-filter";
import { createSaleReportColumns } from "@/features/reports/sale/sale-report-columns";

import type { SaleReportRecord } from "@/features/reports/sale/sale-report-columns";

type SaleListResponse = {
  documents: SaleReportRecord[];
  total_count?: number;
};

export const Route = createFileRoute("/dashboard/reports/sale/")({
  loader: async () => {
    const result = await callMethod<SaleListResponse>("sale.report.index", {
      limit: 1000,
      offset: 0,
      sort_order: "desc",
    });

    return {
      records: result.documents ?? [],
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { records } = Route.useLoaderData();
  const router = useRouter();

  const today = new Date().toLocaleDateString("en-CA");

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [factory, setFactory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [status, setStatus] = useState("All");

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: today,
    toDate: today,
    factory: "All",
    brand: "All",
    status: "All",
  });

  const factories = useMemo(
    () =>
      [...new Set(records.map((sale) => sale.factory).filter(Boolean))].sort(),
    [records],
  );

  const brands = useMemo(
    () =>
      [
        ...new Set(
          records
            .map((sale) => sale.original_brand)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [records],
  );

  const filteredRecords = useMemo(() => {
    return records.filter((sale) => {
      if (appliedFilters.fromDate && sale.sale_date < appliedFilters.fromDate) {
        return false;
      }

      if (appliedFilters.toDate && sale.sale_date > appliedFilters.toDate) {
        return false;
      }

      if (
        appliedFilters.factory !== "All" &&
        sale.factory !== appliedFilters.factory
      ) {
        return false;
      }

      if (
        appliedFilters.brand !== "All" &&
        sale.original_brand !== appliedFilters.brand
      ) {
        return false;
      }

      if (
        appliedFilters.status !== "All" &&
        sale.workflow_state !== appliedFilters.status
      ) {
        return false;
      }

      return true;
    });
  }, [records, appliedFilters]);

  const columns = useMemo(() => createSaleReportColumns(), []);

  const { table } = useDataTable({
    data: filteredRecords,
    columns,
    pageCount: Math.max(1, Math.ceil(filteredRecords.length / 20)),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
    },
  });

  const applyFilters = () => {
    setAppliedFilters({
      fromDate,
      toDate,
      factory,
      brand,
      status,
    });

    table.setPageIndex(0);
  };

  const resetFilters = () => {
    setFromDate(today);
    setToDate(today);
    setFactory("All");
    setBrand("All");
    setStatus("All");

    setAppliedFilters({
      fromDate: today,
      toDate: today,
      factory: "All",
      brand: "All",
      status: "All",
    });

    table.setPageIndex(0);
  };

  const toolbarActions: GlobalToolbarAction[] = [
    {
      id: "print",
      label: "Print",
      icon: Printer,
      variant: "outline",
      onClick: () => window.print(),
    },
  ];

  return (
    <DocTypeListTemplate
      title="Sale Report"
      description={`${filteredRecords.length} sales`}
      records={filteredRecords}
      table={table}
      showCreateButton={false}
      actions={toolbarActions}
      onRefresh={() => router.invalidate()}
      pageSize={20}
      totals={[
        {
          fieldname: "sold_bags",
          label: "Total Bags",
          align: "right",
        },
        {
          fieldname: "sold_quantity",
          label: "Total Kgs",
          decimals: 2,
          align: "right",
        },
      ]}
      beforeTable={
        <SaleReportFilter
          fromDate={fromDate}
          toDate={toDate}
          factory={factory}
          brand={brand}
          status={status}
          factories={factories}
          brands={brands}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onFactoryChange={setFactory}
          onBrandChange={setBrand}
          onStatusChange={setStatus}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      }
    />
  );
}
