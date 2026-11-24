import { useMemo, useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { LotReportFilter } from "@/features/reports/lot/lot-report-filter";

import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";
import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";

import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";
import { Printer, Plus } from "lucide-react";
import { createLotReportColumns } from "@/features/reports/lot/lot-report-columns";

type LotRecord = {
  name: string;
  lot_no: string;
  entry_date: string;
  arrival_date?: string | null;
  factory: string;
  original_brand?: string | null;
  grade?: string | null;
  bags: number;
  net_kg_per_bag: number;
  warehouse?: string | null;
  workflow_state: "Draft" | "Confirmed" | "Cancelled";
  total_kgs: number;
};

type LotListResponse = {
  documents: Omit<LotRecord, "total_kgs">[];
  total_count?: number;
};

export const Route = createFileRoute("/dashboard/reports/lot/")({
  loader: async () => {
    const result = await callMethod<LotListResponse>("lots.report.index", {
      limit: 1000,
      offset: 0,
      sort_order: "desc",
    });

    const records: LotRecord[] = (result.documents ?? []).map((lot) => ({
      ...lot,
      total_kgs: Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0),
    }));

    return { records };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { records } = Route.useLoaderData();

  const navigate = useNavigate();
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
      [...new Set(records.map((lot) => lot.factory).filter(Boolean))].sort(),
    [records],
  );

  const brands = useMemo(
    () =>
      [
        ...new Set(
          records
            .map((lot) => lot.original_brand)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [records],
  );

  const filteredRecords = useMemo(() => {
    return records.filter((lot) => {
      if (appliedFilters.fromDate && lot.entry_date < appliedFilters.fromDate) {
        return false;
      }

      if (appliedFilters.toDate && lot.entry_date > appliedFilters.toDate) {
        return false;
      }

      if (
        appliedFilters.factory !== "All" &&
        lot.factory !== appliedFilters.factory
      ) {
        return false;
      }

      if (
        appliedFilters.brand !== "All" &&
        lot.original_brand !== appliedFilters.brand
      ) {
        return false;
      }

      if (
        appliedFilters.status !== "All" &&
        lot.workflow_state !== appliedFilters.status
      ) {
        return false;
      }

      return true;
    });
  }, [records, appliedFilters]);

  const columns = useMemo(() => createLotReportColumns(), []);
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
    {
      id: "create",
      label: "Lot Registration",
      icon: Plus,
      variant: "default",
      onClick: () => {
        navigate({ to: "/dashboard/lot/new" });
      },
    },
  ];

  return (
    <DocTypeListTemplate
      title="Lot Report"
      description={`${filteredRecords.length} lots`}
      records={filteredRecords}
      table={table}
      showCreateButton={false}
      actions={toolbarActions}
      onRefresh={() => router.invalidate()}
      pageSize={20}
      totals={[
        {
          fieldname: "bags",
          label: "Total Bags",
          align: "right",
        },
        {
          fieldname: "total_kgs",
          label: "Total Kgs",
          decimals: 2,
          align: "right",
        },
      ]}
      beforeTable={
        <LotReportFilter
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
