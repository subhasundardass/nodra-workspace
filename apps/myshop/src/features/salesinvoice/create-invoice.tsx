import * as React from "react";

import { Input } from "@/components/ui/input";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

import { InvoiceDispatchTable } from "./invoice-dispatch-table";
import { InvoiceSummary } from "./invoice-summary";
import { callMethod } from "@/lib/call-method";

export type InvoiceDispatch = {
  name: string;
  dispatch: string;
  dispatch_date: string;
  sale_book: string;
  lot: string;
  lot_no: string;
  mark_brand: string;
  grade: string;
  bags: number;
  kgs: number;
  rate: number;
  amount: number;
};

interface SalesInvoiceFormProps {
  form: NodraForm;
  buyer: string;
  broker: string;
  // buyerName: string;
  // brokerName: string;
}

type BuyerDetails = {
  name: string;
  title: string;
  gstin: string;
  pan: string;
  address: string;
  state: string;
  state_name?: string;
  city: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
};

type InvoicePreviewResponse = {
  buyer_name?: string;
  broker_name?: string;
  buyer_details?: BuyerDetails;
  dispatches: InvoiceDispatch[];
  total_count: number;

  gst_type?: "Intra-State" | "Inter-State" | "";
  gst_rate?: number;

  seller_state_code?: string;
  place_of_supply_code?: string;
};

type PreviewNames = {
  buyerName: string;
  brokerName: string;
};

function FieldRow({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-center gap-3">
      <label htmlFor={htmlFor} className="min-w-0 text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div className="min-w-0 *:w-full">{children}</div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

/**
 * Display-only field.
 * This is deliberately not connected to the DocType form state.
 */
function ReadOnlyField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <FieldRow label={label} htmlFor={name}>
      <Input
        id={name}
        name={name}
        value={value}
        readOnly
        tabIndex={-1}
        className="w-full bg-muted/50 shadow-none"
      />
    </FieldRow>
  );
}

export function SalesInvoiceForm({
  form,
  buyer,
  broker,
}: SalesInvoiceFormProps) {
  const [dispatches, setDispatches] = React.useState<InvoiceDispatch[]>([]);
  const [selectedDispatches, setSelectedDispatches] = React.useState<string[]>(
    [],
  );

  const [buyerDetails, setBuyerDetails] = React.useState<BuyerDetails | null>(
    null,
  );

  //Gst
  const [gstType, setGstType] = React.useState<
    "Intra-State" | "Inter-State" | ""
  >("");
  const [gstRate, setGstRate] = React.useState(0);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Names returned by the preview method can be used as a fallback
  // if the route does not provide them.
  const [previewNames, setPreviewNames] = React.useState<PreviewNames>({
    buyerName: "",
    brokerName: "",
  });

  const displayBuyerName = previewNames.buyerName;
  const displayBrokerName = previewNames.brokerName;

  // Gst

  // Load eligible Dispatch records for the selected Buyer and Broker.
  React.useEffect(() => {
    let cancelled = false;

    async function loadDispatches() {
      if (!buyer || !broker) {
        setDispatches([]);
        setSelectedDispatches([]);
        setPreviewNames({ buyerName: "", brokerName: "" });
        setBuyerDetails(null);
        setGstType("");
        setGstRate(0);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setDispatches([]);
      setSelectedDispatches([]);
      setPreviewNames({ buyerName: "", brokerName: "" });
      setGstType("");
      setGstRate(0);
      try {
        const result = await callMethod<InvoicePreviewResponse>(
          "salesinvoice.get_invoice_preview",
          {
            buyer,
            broker,
          },
        );

        if (cancelled) return;

        setDispatches(result.dispatches ?? []);

        //Gst
        setGstType(result.gst_type ?? "");
        setGstRate(Number(result.gst_rate ?? 0));

        setPreviewNames({
          buyerName: result.buyer_name ?? "",
          brokerName: result.broker_name ?? "",
        });

        const details = result.buyer_details ?? null;
        setBuyerDetails(details);

        if (details) {
          form.setFieldValue("buyer_gstin", details.gstin ?? "");
          form.setFieldValue("buyer_pan", details.pan ?? "");
          form.setFieldValue("place_of_supply", details.state ?? "");
          form.setFieldValue("billing_address", details.address ?? "");
          form.setFieldValue("shipping_address", details.address ?? "");
        }
      } catch (err) {
        if (cancelled) return;

        setDispatches([]);
        setBuyerDetails(null);
        setGstType("");
        setGstRate(0);
        setPreviewNames({
          buyerName: "",
          brokerName: "",
        });

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load eligible Dispatch records.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDispatches();

    return () => {
      cancelled = true;
    };
  }, [buyer, broker]);

  // Convert selected Dispatch records into SalesInvoiceItem rows.
  const selectedItems = React.useMemo(() => {
    return dispatches
      .filter((item) => selectedDispatches.includes(item.name))
      .map((item) => ({
        dispatch: item.name,
        sale_book: item.sale_book,
        lot: item.lot,
        mark_brand: item.mark_brand,
        grade: item.grade,
        bags: item.bags,
        kgs: item.kgs,
        rate: item.rate,
        amount: item.amount,
      }));
  }, [dispatches, selectedDispatches]);

  // Keep the SalesInvoice child table synchronized with selected Dispatches.
  React.useEffect(() => {
    form.setFieldValue("items", selectedItems);
  }, [form, selectedItems]);

  const handleSelection = (selected: string[]) => {
    setSelectedDispatches(selected);
  };

  return (
    <div className="space-y-2">
      <FormSection
        title="Invoice Details"
        description="Review the buyer, broker and invoice date."
      >
        <ReadOnlyField
          label="Buyer"
          name="buyer_display"
          value={displayBuyerName}
        />

        <ReadOnlyField
          label="Broker"
          name="broker_display"
          value={displayBrokerName}
        />

        <form.Field name="buyer_gstin">
          {(field) => (
            <FieldRow label="Buyer GSTIN" htmlFor={field.name}>
              <Input
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                readOnly
                className="bg-muted/50 shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="buyer_pan">
          {(field) => (
            <FieldRow label="Buyer PAN" htmlFor={field.name}>
              <Input
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                readOnly
                className="bg-muted/50 shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      <FormSection
        title="Billing & Shipping Details"
        description="Enter the billing and delivery addresses."
      >
        <form.Field name="invoice_date">
          {(field) => (
            <FieldRow label="Invoice Date" htmlFor={field.name} required>
              <DateField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                className="w-full"
                inputClassName="text-right"
              />
            </FieldRow>
          )}
        </form.Field>
        <form.Field name="place_of_supply">
          {(field) => (
            <FieldRow label="Place of Supply" htmlFor={field.name}>
              <LinkField
                doctype="State"
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                className="w-full"
                readOnly
              />
            </FieldRow>
          )}
        </form.Field>
        <form.Field name="billing_address">
          {(field) => (
            <FieldRow label="Billing Address" htmlFor={field.name} required>
              <textarea
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={3}
                readOnly
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="shipping_address">
          {(field) => (
            <FieldRow label="Shipping Address" htmlFor={field.name} required>
              <textarea
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={3}
                readOnly
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-none"
              />
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <div>
          <h3 className="text-base font-semibold">Dispatch Items</h3>
          <p className="text-sm text-muted-foreground">
            Select confirmed dispatches for this buyer and broker.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <InvoiceDispatchTable
          dispatches={dispatches}
          selectedDispatches={selectedDispatches}
          onSelectionChange={handleSelection}
          loading={loading}
        />
      </section>

      <FormSection
        title="Invoice Summary"
        description="Review quantities and invoice amounts."
      >
        <div className="md:col-span-2">
          <InvoiceSummary
            dispatches={dispatches}
            selectedDispatches={selectedDispatches}
            gstRate={gstRate}
            gstType={gstType}
          />
        </div>
      </FormSection>

      <form.Field name="remarks">
        {(field) => (
          <FieldRow label="Remarks" htmlFor={field.name}>
            <textarea
              id={field.name}
              name={field.name}
              value={String(field.state.value ?? "")}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-none"
            />
          </FieldRow>
        )}
      </form.Field>
    </div>
  );
}
