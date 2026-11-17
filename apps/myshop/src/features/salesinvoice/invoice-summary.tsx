import { useMemo } from "react";

import { Separator } from "@/components/ui/separator";
import { InvoiceDispatch } from "./create-invoice";

type InvoiceSummaryProps = {
  dispatches: InvoiceDispatch[];
  selectedDispatches: string[];
};

function formatAmount(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function InvoiceSummary({
  dispatches,
  selectedDispatches,
}: InvoiceSummaryProps) {
  const summary = useMemo(() => {
    const selected = dispatches.filter((item) =>
      selectedDispatches.includes(item.name),
    );

    return {
      count: selected.length,
      bags: selected.reduce((total, item) => total + item.bags, 0),
      kgs: selected.reduce((total, item) => total + item.kgs, 0),
      subtotal: selected.reduce((total, item) => total + item.amount, 0),
    };
  }, [dispatches, selectedDispatches]);

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Selected Dispatches</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {summary.count}
          </p>
        </div>

        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Total Bags</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {summary.bags.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Total Kgs</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {summary.kgs.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 3,
            })}
          </p>
        </div>
      </div>

      <Separator />

      <div className="ml-auto max-w-md space-y-3">
        <SummaryRow label="Subtotal" value={formatAmount(summary.subtotal)} />

        <SummaryRow label="CGST" value={formatAmount(0)} />
        <SummaryRow label="SGST" value={formatAmount(0)} />
        <SummaryRow label="IGST" value={formatAmount(0)} />

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold">Grand Total</span>
          <span className="text-xl font-bold tabular-nums">
            {formatAmount(summary.subtotal)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Taxes are not included in this preview. Final tax calculation will be
          performed and validated by the invoice backend.
        </p>
      </div>
    </div>
  );
}
