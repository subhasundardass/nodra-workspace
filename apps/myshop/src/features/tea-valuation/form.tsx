import { useEffect, useState } from "react";

import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";
import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";
import { Textarea } from "@/components/ui/textarea";
import { callMethod } from "@/lib/call-method";

interface TeaValuationFormProps {
  form: NodraForm;
  lot: Record<string, unknown>;
  testing: Record<string, unknown>;
}

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
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-start gap-3">
      <label
        htmlFor={htmlFor}
        className="pt-2 text-sm font-medium text-muted-foreground"
      >
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
      <div className="space-y-0">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function displayValue(value: unknown): string {
  return value == null || value === "" ? "—" : String(value);
}

function displayNumber(value: unknown): string {
  if (value == null || value === "") return "—";

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "—";
}

function displayCurrency(value: unknown): string {
  if (value == null || value === "") return "—";

  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      })
    : "—";
}

function ReadOnlyField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: unknown;
}) {
  return (
    <FieldRow label={label} htmlFor={id}>
      <DataField
        id={id}
        value={displayValue(value)}
        onChange={() => {}}
        readOnly
        className="w-full"
        inputClassName="bg-muted/50 text-foreground"
      />
    </FieldRow>
  );
}

function useLinkLabel(
  doctype: string,
  name: unknown,
  titleField: string,
): string {
  const [label, setLabel] = useState("");
  const selectedName = String(name ?? "");

  useEffect(() => {
    let cancelled = false;

    if (!selectedName) {
      setLabel("");
      return;
    }

    async function loadLabel() {
      try {
        const result = await callMethod<{
          items: { name: string; label: string }[];
        }>("links.search", {
          doctype,
          query: "",
          selectedName,
          titleField,
          limit: 1,
        });

        if (!cancelled) {
          const item = result.items?.find(
            (entry) => entry.name === selectedName,
          );

          setLabel(item?.label ?? selectedName);
        }
      } catch (error) {
        if (!cancelled) {
          setLabel(selectedName);
          console.error(`Failed to load ${doctype} label:`, error);
        }
      }
    }

    void loadLabel();

    return () => {
      cancelled = true;
    };
  }, [doctype, selectedName, titleField]);

  return label;
}

export function TeaValuationForm({
  form,
  lot,
  testing,
}: TeaValuationFormProps) {
  const lotName = String(lot.name ?? "");
  const testingName = String(testing.name ?? "");

  const factoryLabel = useLinkLabel("Factory", lot.factory, "factory_name");
  const registeredGradeLabel = useLinkLabel("Grades", lot.grade, "grade_code");
  const testedGradeLabel = useLinkLabel(
    "Grades",
    testing.tested_grade,
    "grade_code",
  );
  const originalBrand = useLinkLabel("Brand", lot.original_brand, "title");

  const bags = Number(lot.bags ?? 0);
  const kgPerBag = Number(lot.net_kg_per_bag ?? 0);
  const totalWeight = bags * kgPerBag;

  const workflowState = String(form.getFieldValue("workflow_state") ?? "Draft");
  const readOnly =
    workflowState === "Confirmed" || workflowState === "Cancelled";

  const [finalRate, setFinalRate] = useState(
    Number(form.getFieldValue("final_rate") ?? 0),
  );

  useEffect(() => {
    const currentRate = Number(form.getFieldValue("final_rate") ?? 0);
    setFinalRate(Number.isFinite(currentRate) ? currentRate : 0);
  }, [form]);

  const estimatedValue = totalWeight * Math.max(0, finalRate);

  return (
    <div className="space-y-6">
      <FormSection
        title="Lot Registration Details"
        description="Reference details from the confirmed lot. These values cannot be changed here."
      >
        <ReadOnlyField id="lot_name" label="Lot ID" value={lotName} />
        <ReadOnlyField id="lot_no" label="Lot No." value={lot.lot_no} />
        <ReadOnlyField id="factory" label="Factory" value={factoryLabel} />
        <ReadOnlyField
          id="original_brand"
          label="Original Brand"
          value={originalBrand}
        />
        <ReadOnlyField
          id="registered_grade"
          label="Registered Grade"
          value={registeredGradeLabel}
        />
        <ReadOnlyField id="bags" label="Bags" value={bags} />
        <ReadOnlyField
          id="net_kg_per_bag"
          label="Net KG / Bag"
          value={kgPerBag}
        />
        <ReadOnlyField
          id="total_weight"
          label="Total Weight (kg)"
          value={displayNumber(totalWeight)}
        />
        <ReadOnlyField
          id="arrival_date"
          label="Arrival Date"
          value={lot.arrival_date}
        />
      </FormSection>

      <FormSection
        title="Tea Testing Results"
        description="Review the completed quality test before determining the valuation."
      >
        <ReadOnlyField
          id="testing_name"
          label="Testing Record"
          value={testingName}
        />
        <ReadOnlyField
          id="sample_date"
          label="Testing Date"
          value={testing.sample_date}
        />
        <ReadOnlyField
          id="tested_grade"
          label="Tested Grade"
          value={testedGradeLabel}
        />
        <ReadOnlyField
          id="quality_score"
          label="Quality Score"
          value={testing.quality_score}
        />
        <div className="md:col-span-1">
          <FieldRow label="Taste" htmlFor="testing_taste">
            <Textarea
              id="testing_taste"
              value={String(testing.taste ?? "")}
              readOnly
              className="min-h-10 resize-y bg-muted/50"
            />
          </FieldRow>
        </div>
        <div className="md:col-span-1">
          <FieldRow label="Testing Remarks" htmlFor="testing_remarks">
            <Textarea
              id="testing_remarks"
              value={String(testing.test_remarks ?? "")}
              readOnly
              className="min-h-10 resize-y bg-muted/50"
            />
          </FieldRow>
        </div>
      </FormSection>

      <FormSection
        title="Market Valuation"
        description="Record the reference price used to determine the lot's estimated market value."
      >
        <form.Field name="lot">
          {(field) => (
            <FieldRow label="Linked Lot" htmlFor={field.name} required>
              <DataField
                id={field.name}
                name={field.name}
                value={lotName}
                onChange={() => {}}
                readOnly
                className="w-full"
                inputClassName="bg-muted/50 text-foreground"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="tea_testing">
          {(field) => (
            <FieldRow label="Testing Record" htmlFor={field.name} required>
              <DataField
                id={field.name}
                name={field.name}
                value={testingName}
                onChange={() => {}}
                readOnly
                className="w-full"
                inputClassName="bg-muted/50 text-foreground"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="valuation_date">
          {(field) => (
            <FieldRow label="Valuation Date" htmlFor={field.name} required>
              <DateField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                required
                disabled={readOnly}
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="valuation_basis">
          {(field) => (
            <FieldRow label="Valuation Basis" htmlFor={field.name} required>
              <select
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "Both")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                disabled={readOnly}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Market">Market Price</option>
                <option value="Previous Auction">Previous Auction</option>
                <option value="Both">Market + Previous Auction</option>
              </select>
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="reference_rate">
          {(field) => (
            <FieldRow label="Ref. Rate / kg (₹)" htmlFor={field.name} required>
              <input
                id={field.name}
                name={field.name}
                type="number"
                min={0}
                step="0.01"
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value === "" ? "" : Number(event.target.value),
                  )
                }
                disabled={readOnly}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter reference rate per kg"
              />
            </FieldRow>
          )}
        </form.Field>

        <div className="md:col-span-2">
          <form.Field name="reference_details">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Reference Details
                </label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "")}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={readOnly}
                  placeholder="Mention market source, auction date, auction centre or comparable lot details..."
                  className="min-h-20 resize-y bg-background"
                />
              </div>
            )}
          </form.Field>
        </div>
      </FormSection>

      <FormSection
        title="Final Valuation"
        description="Assign one final grade and one rate to the entire lot."
      >
        <form.Field name="final_grade">
          {(field) => (
            <FieldRow label="Final Grade" htmlFor={field.name} required>
              <LinkField
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                doctype="Grades"
                titleField="grade_code"
                pageSize={10}
                className="w-full"
                disabled={readOnly}
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="final_rate">
          {(field) => (
            <FieldRow label="Final Rate / kg (₹)" htmlFor={field.name} required>
              <input
                id={field.name}
                name={field.name}
                type="number"
                min={0}
                step="0.01"
                value={String(field.state.value ?? "")}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  const value =
                    event.target.value === "" ? "" : Number(event.target.value);

                  field.handleChange(value);
                  setFinalRate(value === "" ? 0 : Number(value));
                }}
                disabled={readOnly}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter final rate per kg"
              />
            </FieldRow>
          )}
        </form.Field>

        <ReadOnlyField
          id="valuation_weight"
          label="Value. Weight (kg)"
          value={displayNumber(totalWeight)}
        />

        <ReadOnlyField
          id="estimated_value_preview"
          label="Estimated Value"
          value={displayCurrency(estimatedValue)}
        />

        <form.Field name="workflow_state">
          {(field) => (
            <FieldRow label="Valuation Status" htmlFor={field.name}>
              <DataField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "Draft")}
                onChange={() => {}}
                readOnly
                className="w-full"
                inputClassName="bg-muted/50 text-foreground"
              />
            </FieldRow>
          )}
        </form.Field>

        <div className="md:col-span-2">
          <form.Field name="remarks">
            {(field) => (
              <div className="space-y-2">
                <label htmlFor={field.name} className="text-sm font-medium">
                  Valuation Remarks
                </label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? "")}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={readOnly}
                  placeholder="Add valuation notes, price justification or buyer-facing observations..."
                  className="min-h-20 resize-y bg-background"
                />
              </div>
            )}
          </form.Field>
        </div>
      </FormSection>
    </div>
  );
}
