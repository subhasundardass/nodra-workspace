import { CalendarDays, MapPin, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type InvoiceInformationData = {
  buyer_name: string;
  broker_name: string;
  invoice_date: string;
  buyer_gstin: string;
  place_of_supply: string;
  billing_address: string;
  shipping_address: string;
};

type InvoiceInformationProps = {
  data: InvoiceInformationData;
};

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

export function InvoiceInformation({ data }: InvoiceInformationProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Buyer</Label>
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{data.buyer_name}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Broker</Label>
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{data.broker_name}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Invoice Date</Label>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{data.invoice_date}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Billing Details</Label>
          <InfoItem label="GSTIN" value={data.buyer_gstin} />
          <InfoItem label="Place of Supply" value={data.place_of_supply} />
          <InfoItem label="Billing Address" value={data.billing_address} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Shipping Details</Label>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="whitespace-pre-line text-sm">
              {data.shipping_address || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
