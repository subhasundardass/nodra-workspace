import { useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { callMethod } from "@/lib/call-method";
import { useDataTable } from "@/hooks/use-data-table";
import { DocTypeListTemplate } from "@/components/doctype/templates/doctype-list-template";

import { Printer } from "lucide-react";
import type { GlobalToolbarAction } from "@/components/toolbar/global-toolbar";

import { OfferReportFilter } from "@/features/reports/offer/offer-report-filter";
import {
  createOfferReportColumns,
  type OfferReportRecord,
} from "@/features/reports/offer/offer-report-columns";

type OfferListResponse = {
  documents: OfferReportRecord[];
  total_count?: number;
};

export const Route = createFileRoute("/dashboard/reports/offer/")({
  loader: async () => {
    const result = await callMethod<OfferListResponse>("offers.report.index", {
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
  const [brokerType, setBrokerType] = useState("All");
  const [status, setStatus] = useState("All");

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: today,
    toDate: today,
    factory: "All",
    brand: "All",
    brokerType: "All",
    status: "All",
  });

  const factories = useMemo(
    () =>
      [
        ...new Set(records.map((offer) => offer.factory).filter(Boolean)),
      ].sort(),
    [records],
  );

  const brands = useMemo(
    () =>
      [
        ...new Set(
          records
            .map((offer) => offer.original_brand)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [records],
  );

  const filteredRecords = useMemo(() => {
    return records.filter((offer) => {
      if (
        appliedFilters.fromDate &&
        offer.offer_date < appliedFilters.fromDate
      ) {
        return false;
      }

      if (appliedFilters.toDate && offer.offer_date > appliedFilters.toDate) {
        return false;
      }

      if (
        appliedFilters.factory !== "All" &&
        offer.factory !== appliedFilters.factory
      ) {
        return false;
      }

      if (
        appliedFilters.brand !== "All" &&
        offer.original_brand !== appliedFilters.brand
      ) {
        return false;
      }

      if (
        appliedFilters.brokerType !== "All" &&
        offer.broker_type !== appliedFilters.brokerType
      ) {
        return false;
      }

      if (
        appliedFilters.status !== "All" &&
        offer.workflow_state !== appliedFilters.status
      ) {
        return false;
      }

      return true;
    });
  }, [records, appliedFilters]);

  const columns = useMemo(() => createOfferReportColumns(), []);

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
      brokerType,
      status,
    });

    table.setPageIndex(0);
  };

  const resetFilters = () => {
    setFromDate(today);
    setToDate(today);
    setFactory("All");
    setBrand("All");
    setBrokerType("All");
    setStatus("All");

    setAppliedFilters({
      fromDate: today,
      toDate: today,
      factory: "All",
      brand: "All",
      brokerType: "All",
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
      title="Offer Report"
      description={`${filteredRecords.length} offer lots`}
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
        <OfferReportFilter
          fromDate={fromDate}
          toDate={toDate}
          factory={factory}
          brand={brand}
          brokerType={brokerType}
          status={status}
          factories={factories}
          brands={brands}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onFactoryChange={setFactory}
          onBrandChange={setBrand}
          onBrokerTypeChange={setBrokerType}
          onStatusChange={setStatus}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      }
    />
  );
}
