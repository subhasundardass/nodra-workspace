import { DataField } from "@/components/doctype/fields/data-field";
import { DateField } from "@/components/doctype/fields/date-field";
import { LinkField } from "@/components/doctype/fields/link-field";
import { Textarea } from "@/components/ui/textarea";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";
import { callMethod } from "@/lib/call-method";
import { useEffect, useState } from "react";

interface TeaTestingFormProps {
  form: NodraForm;
  lot: Record<string, unknown>;
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
      <div className="space-y-1">
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

export function TeaTestingForm({ form, lot }: TeaTestingFormProps) {
  const lotName = String(lot.name ?? "");
  const [originalGrade, setOriginalGrade] = useState("");
  const [originalFactory, setOriginalFactory] = useState("");
  const [originalBrand, setOriginalBrand] = useState("");

  const workflowState = String(form.getFieldValue("workflow_state") ?? "Draft");
  const readOnly = workflowState === "Completed";

  useEffect(() => {
    let cancelled = false;

    async function loadGrade() {
      const gradeName = String(lot.grade ?? "");

      if (!gradeName) {
        setOriginalGrade("");
        return;
      }

      try {
        const result = await callMethod<{
          items: { name: string; label: string }[];
        }>("links.search", {
          doctype: "Grades",
          query: "",
          selectedName: gradeName,
          titleField: "grade_code",
          limit: 1,
        });

        if (!cancelled) {
          const grade = result.items.find((item) => item.name === gradeName);

          setOriginalGrade(grade?.label ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setOriginalGrade("");
          console.error("Failed to load incoming grade:", error);
        }
      }
    }

    //--Brand
    async function loadBrand() {
      const brandName = String(lot.original_brand ?? "");

      if (!brandName) {
        setOriginalBrand("");
        return;
      }

      try {
        const result = await callMethod<{
          items: { name: string; label: string }[];
        }>("links.search", {
          doctype: "Brand",
          query: "",
          selectedName: brandName,
          titleField: "title",
          limit: 1,
        });

        if (!cancelled) {
          const brand = result.items.find((item) => item.name === brandName);

          setOriginalBrand(brand?.label ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setOriginalBrand("");
          console.error("Failed to load brand:", error);
        }
      }
    }

    //Factory
    async function loadFactory() {
      const factoryName = String(lot.factory ?? "");

      if (!factoryName) {
        setOriginalFactory("");
        return;
      }

      try {
        const result = await callMethod<{
          items: { name: string; label: string }[];
        }>("links.search", {
          doctype: "Factory",
          query: "",
          selectedName: factoryName,
          titleField: "factory_name",
          limit: 1,
        });

        if (!cancelled) {
          const factory = result.items.find(
            (item) => item.name === factoryName,
          );

          setOriginalFactory(factory?.label ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setOriginalFactory("");
          console.error("Failed to load factory:", error);
        }
      }
    }

    void loadGrade();
    void loadBrand();
    void loadFactory();

    return () => {
      cancelled = true;
    };
  }, [lot.grade]);

  return (
    <div className="space-y-6">
      {/* Registration information: reference only */}
      <FormSection
        title="Lot Registration Details"
        description="These details come from the confirmed lot registry and cannot be edited here."
      >
        <ReadOnlyField id="lot_name" label="Lot ID" value={lotName} />
        <ReadOnlyField id="lot_no" label="Lot No." value={lot.lot_no} />
        <ReadOnlyField id="factory" label="Factory" value={originalFactory} />
        <ReadOnlyField
          id="original_brand"
          label="Original Brand"
          value={originalBrand}
        />
        <ReadOnlyField
          id="original_grade"
          label="Registered Grade"
          value={originalGrade}
        />
        <ReadOnlyField id="bags" label="Bags" value={lot.bags} />
        <ReadOnlyField
          id="net_kg_per_bag"
          label="Net KG / Bag"
          value={lot.net_kg_per_bag}
        />
        <ReadOnlyField
          id="entry_date"
          label="Registration Date"
          value={lot.entry_date}
        />
      </FormSection>

      {/* Tester input */}
      <FormSection
        title="Tea Quality Testing"
        description="Record the sample date, assess the tea, and select the grade identified by testing."
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

        <form.Field name="sample_date">
          {(field) => (
            <FieldRow label="Testing Date" htmlFor={field.name} required>
              <DateField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                required
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="tested_grade">
          {(field) => (
            <FieldRow label="Tested Grade" htmlFor={field.name}>
              <LinkField
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                doctype="Grades"
                titleField="grade_code"
                pageSize={10}
                className="w-full"
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="workflow_state">
          {(field) => (
            <FieldRow label="Testing Status" htmlFor={field.name}>
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
          <div className="mb-4 border-t pt-4">
            <h4 className="text-sm font-semibold">Sensory Assessment</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Record observations of the dry leaf, infused leaf, liquor, taste,
              and overall quality.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <form.Field name="appearance">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Dry Leaf Appearance
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Leaf size, colour, shape, tips and overall appearance..."
                    className="min-h-15 resize-y bg-background"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="infusion">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Infusion (Wet Leaf)
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Infused leaf colour, evenness, brightness and condition..."
                    className="min-h-15 resize-y bg-background"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="liquor">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Liquor
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Colour, brightness, clarity and strength..."
                    className="min-h-15 resize-y bg-background"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="taste">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Taste and Flavour
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Briskness, body, aroma, flavour, astringency and aftertaste..."
                    className="min-h-15 resize-y bg-background"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="defects">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Defects / Quality Issues
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Stale, smoky, musty, coarse or other undesirable characteristics..."
                    className="min-h-15 resize-y bg-background"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="quality_score">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Quality Score (1–10)
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={String(field.state.value ?? "")}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                      )
                    }
                    placeholder="Enter score from 1 to 10"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use your team's agreed scoring criteria.
                  </p>
                </div>
              )}
            </form.Field>

            <form.Field name="test_remarks">
              {(field) => (
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor={field.name} className="text-sm font-medium">
                    Testing Remarks
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={String(field.state.value ?? "")}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Additional observations, suitability or recommendations..."
                    className="min-h-15 resize-y bg-background"
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
