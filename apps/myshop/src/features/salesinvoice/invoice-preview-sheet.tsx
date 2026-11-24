import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InvoiceDispatch } from "./create-invoice";

type InvoicePreviewSummary = {
  count: number;
  bags: number;
  kgs: number;
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
};

type InvoicePreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispatches: InvoiceDispatch[];
  summary: InvoicePreviewSummary;
  gstType: "Intra-State" | "Inter-State" | "";
};

const formatAmount = (value: number) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date = new Date()) => date.toLocaleDateString("en-GB");

function InvoiceLine({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="grid grid-cols-[105px_1fr] gap-1">
      <span>{label}</span>
      <span>: {value || "—"}</span>
    </div>
  );
}

function InvoicePreviewSheet({
  open,
  onOpenChange,
  dispatches,
  summary,
  gstType,
}: InvoicePreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-[900px]"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Invoice Preview</SheetTitle>
          <SheetDescription>A4 tax invoice preview</SheetDescription>
        </SheetHeader>

        <div className="overflow-x-auto bg-muted/40 p-4 sm:p-6">
          {/* A4 Invoice Paper */}
          <div
            className="mx-auto min-h-[297mm] w-[210mm] shrink-0 bg-white p-[8mm] text-[9px] leading-[1.35] text-black shadow-md"
            style={{
              fontFamily: "Arial, sans-serif",
            }}
          >
            {/* Top Header */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
              <div className="space-y-1 font-mono">
                <InvoiceLine label="CIN" value="—" />
                <InvoiceLine label="GSTIN" value="—" />
                <InvoiceLine label="FSSAI No." value="—" />
              </div>

              <div className="border border-black px-3 py-1 text-center text-base font-bold">
                TAX INVOICE
              </div>

              <div className="space-y-1 text-right">
                <div>[ ] RECIPIENT'S COPY</div>
                <div>[ ] TRANSPORTER'S COPY</div>
                <div>[✓] SELLER'S COPY</div>
              </div>
            </div>

            {/* Company Details */}
            <div className="mt-3 border-b border-black pb-2 text-center">
              <h2 className="text-lg font-bold uppercase">YOUR COMPANY NAME</h2>
              <div className="mt-2 space-y-1 text-left">
                <InvoiceLine label="Corporate Office" value="Company address" />
                <InvoiceLine
                  label="Correspondence Office"
                  value="Office address"
                />
                <InvoiceLine label="Email" value="Email and phone number" />
                <InvoiceLine label="Factory Address" value="Factory address" />
                <InvoiceLine
                  label="Place of Despatch"
                  value="West Bengal - 19"
                />
              </div>
            </div>

            {/* Invoice Metadata */}
            <div className="space-y-1 border-b border-black py-2">
              <InvoiceLine label="IRN No." value="—" />
              <InvoiceLine label="Acknowledgement No." value="—" />

              <div className="grid grid-cols-2 gap-4">
                <InvoiceLine label="Tax Invoice No." value="—" />
                <InvoiceLine label="ACK Date" value="—" />
              </div>

              <div className="text-right">
                <InvoiceLine label="Date" value={formatDate()} />
              </div>
            </div>

            {/* Buyer and Consignee */}
            <div className="mt-2 grid grid-cols-2 border border-black">
              <div className="border-r border-black">
                <div className="border-b border-black p-1 font-bold">
                  Billed To / Buyer's Details
                </div>

                <div className="space-y-1 p-1">
                  <InvoiceLine label="Name" value="Buyer name" />
                  <InvoiceLine label="Address" value="Buyer address" />
                  <InvoiceLine label="PAN" />
                  <InvoiceLine label="TMCO" />
                  <InvoiceLine label="GSTIN" />
                </div>
              </div>

              <div>
                <div className="border-b border-black p-1 font-bold">
                  Shipped To / Consignee's Details
                </div>

                <div className="space-y-1 p-1">
                  <InvoiceLine label="Name" value="Consignee name" />
                  <InvoiceLine label="Address" value="Consignee address" />
                  <InvoiceLine label="State/SC" />
                  <InvoiceLine label="GSTIN" />
                </div>
              </div>
            </div>

            {/* HSN and Description */}
            <div className="mt-3 flex justify-between border-y border-black px-2 py-2 font-bold">
              <span>HSN CODE : —</span>
              <span>DESCRIPTION : BLACK TEA</span>
            </div>

            {/* Items Table */}
            <table className="w-full table-fixed border-collapse text-center">
              <thead>
                <tr className="border-b border-black">
                  <th className="w-[21%] border-r border-black p-1 font-normal">
                    Brand
                  </th>
                  <th className="w-[9%] border-r border-black p-1 font-normal">
                    Lot No.
                  </th>
                  <th className="w-[10%] border-r border-black p-1 font-normal">
                    Grade
                  </th>
                  <th className="w-[11%] border-r border-black p-1 font-normal">
                    No. of Pkg.
                  </th>
                  <th className="w-[12%] border-r border-black p-1 font-normal">
                    Qty. per Pkg. (Kgs.)
                  </th>
                  <th className="w-[12%] border-r border-black p-1 font-normal">
                    Net Weight (Kgs.)
                  </th>
                  <th className="w-[12%] border-r border-black p-1 font-normal">
                    Rate per Kg.
                  </th>
                  <th className="w-[13%] p-1 font-normal">Amount (Rs.)</th>
                </tr>
              </thead>

              <tbody>
                {dispatches.map((item) => (
                  <tr key={item.name} className="h-7">
                    <td className="border-r border-black px-1">—</td>
                    <td className="border-r border-black px-1">{item.name}</td>
                    <td className="border-r border-black px-1">—</td>
                    <td className="border-r border-black px-1">{item.bags}</td>
                    <td className="border-r border-black px-1">—</td>
                    <td className="border-r border-black px-1">
                      {item.kgs.toFixed(3)}
                    </td>
                    <td className="border-r border-black px-1">—</td>
                    <td className="px-1 text-right">
                      {formatAmount(item.amount)}
                    </td>
                  </tr>
                ))}

                {/* Empty space similar to printed invoice */}
                {Array.from({
                  length: Math.max(0, 5 - dispatches.length),
                }).map((_, index) => (
                  <tr key={`empty-${index}`} className="h-10">
                    {Array.from({ length: 8 }).map((_, cell) => (
                      <td
                        key={cell}
                        className={cell === 7 ? "" : "border-r border-black"}
                      />
                    ))}
                  </tr>
                ))}

                <tr className="border-y border-black font-bold">
                  <td colSpan={3} className="p-1 text-left">
                    Total
                  </td>
                  <td>{summary.bags}</td>
                  <td />
                  <td>{summary.kgs.toFixed(3)}</td>
                  <td />
                  <td className="p-1 text-right">
                    {formatAmount(summary.subtotal)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Declaration and Tax Summary */}
            <div className="grid grid-cols-[60%_40%] border-b border-black">
              <div className="space-y-3 border-r border-black p-2">
                <p>
                  We hereby certify that the food mentioned in this invoice is
                  warranted to be of the nature and quality it purports to be
                  and conforms to the requirements of the Food Safety &
                  Standards Act, 2006 and regulations made there under.
                </p>

                <p>
                  The teas in this invoice were made from green leaf and comply
                  with applicable requirements.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between p-1">
                  <span>Total Taxable Value</span>
                  <strong>{formatAmount(summary.subtotal)}</strong>
                </div>

                {gstType === "Intra-State" && (
                  <>
                    <div className="flex justify-between border-t border-black p-1">
                      <span>CGST {summary.cgstRate}%</span>
                      <span>{formatAmount(summary.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-black p-1">
                      <span>SGST {summary.sgstRate}%</span>
                      <span>{formatAmount(summary.sgstAmount)}</span>
                    </div>
                  </>
                )}

                {gstType === "Inter-State" && (
                  <div className="flex justify-between border-t border-black p-1">
                    <span>IGST {summary.igstRate}%</span>
                    <span>{formatAmount(summary.igstAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-black p-1">
                  <span>Round Off</span>
                  <span>0.00</span>
                </div>

                <div className="flex justify-between border-y border-black p-2 text-[11px] font-bold">
                  <span>Total Invoice Value</span>
                  <span>{formatAmount(summary.grandTotal)}</span>
                </div>

                <div className="flex justify-between p-1">
                  <span>Tax under Reverse Charge</span>
                  <span>No</span>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="border-b border-black py-2">
              <strong>Amount In Words :</strong>
              <span className="ml-2 uppercase">
                Amount in words will appear here.
              </span>
            </div>

            {/* Transport and Bank Details */}
            <div className="grid grid-cols-2 gap-4 border-b border-black py-2">
              <div className="space-y-1">
                <InvoiceLine label="Transporter's Name" value="—" />
                <InvoiceLine label="Bank Name" value="—" />
                <InvoiceLine label="A/C No." value="—" />
                <InvoiceLine label="IFSC No." value="—" />
                <InvoiceLine label="PAN" value="—" />
              </div>

              <div className="flex flex-col justify-end text-right">
                <p className="font-bold">For YOUR COMPANY NAME</p>
                <div className="mt-8">Authorized Signatory</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 text-center">
              <p>
                Note: Payment terms and discount conditions will appear here.
              </p>
              <p className="mt-2 font-mono tracking-widest">
                ALL SUBJECT TO SILIGURI JURISDICTION
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export { InvoicePreviewSheet };
