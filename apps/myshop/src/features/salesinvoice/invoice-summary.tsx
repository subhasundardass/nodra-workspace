import { useMemo, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { InvoiceDispatch } from "./create-invoice";
import { Button } from "@/components/ui/button";
import { InvoicePreviewSheet } from "./invoice-preview-sheet";

type InvoiceSummaryProps = {
  dispatches: InvoiceDispatch[];
  selectedDispatches: string[];
  gstRate: number;
  gstType: "Intra-State" | "Inter-State" | "";
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
  gstRate,
  gstType,
}: InvoiceSummaryProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const handlePreview = () => {
    setPreviewOpen(true);
  };
  const selected = useMemo(
    () => dispatches.filter((item) => selectedDispatches.includes(item.name)),
    [dispatches, selectedDispatches],
  );
  const summary = useMemo(() => {
    const bags = selected.reduce((total, item) => total + item.bags, 0);

    const kgs = selected.reduce((total, item) => total + item.kgs, 0);

    const subtotal = selected.reduce((total, item) => total + item.amount, 0);

    const validRate = Math.max(0, Number(gstRate) || 0);

    const cgstRate = gstType === "Intra-State" ? validRate / 2 : 0;
    const sgstRate = gstType === "Intra-State" ? validRate / 2 : 0;
    const igstRate = gstType === "Inter-State" ? validRate : 0;

    const cgstAmount = (subtotal * cgstRate) / 100;
    const sgstAmount = (subtotal * sgstRate) / 100;
    const igstAmount = (subtotal * igstRate) / 100;

    const totalTax = cgstAmount + sgstAmount + igstAmount;

    return {
      count: selected.length,
      bags,
      kgs,
      subtotal,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      grandTotal: subtotal + totalTax,
    };
  }, [selected, gstRate, gstType]);

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

      <div className="flex items-end justify-between gap-6 mt-4">
        {/* Left side: Disclaimer + Preview */}
        <div className="space-y-3">
          <p className="max-w-md text-xs text-muted-foreground">
            GST shown is a preview. Final GST rates and amounts will be
            recalculated and validated by the invoice backend.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              Preview
            </Button>

            {/* <Button variant="secondary" size="sm">
              Generate Invoice
            </Button>

            <Button variant="default" size="sm">
              Confirm
            </Button> */}

            <Button
              variant="outline"
              size="sm"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Print Invoice
            </Button>
          </div>
        </div>

        {/* Right side: Amount Summary */}
        <div className="ml-auto max-w-md space-y-3">
          <SummaryRow
            label="Taxable Amount"
            value={formatAmount(summary.subtotal)}
          />

          {gstType === "Intra-State" && (
            <>
              <SummaryRow
                label={`CGST (${summary.cgstRate}%)`}
                value={formatAmount(summary.cgstAmount)}
              />
              <SummaryRow
                label={`SGST (${summary.sgstRate}%)`}
                value={formatAmount(summary.sgstAmount)}
              />
            </>
          )}

          {gstType === "Inter-State" && (
            <SummaryRow
              label={`IGST (${summary.igstRate}%)`}
              value={formatAmount(summary.igstAmount)}
            />
          )}

          {!gstType && (
            <p className="text-xs text-destructive">
              GST type could not be determined. Please check Place of Supply.
            </p>
          )}

          <Separator />

          <SummaryRow
            label="Total GST"
            value={formatAmount(summary.totalTax)}
          />

          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">Grand Total</span>
            <span className="text-xl font-bold tabular-nums">
              {formatAmount(summary.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <InvoicePreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        dispatches={selected}
        summary={summary}
        gstType={gstType}
      />
    </div>
  );
}
