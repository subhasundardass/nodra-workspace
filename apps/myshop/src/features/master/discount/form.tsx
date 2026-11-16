import * as React from "react";

import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DateField from "@/components/doctype/fields/date-field";

interface DiscountFormProps {
  form: NodraForm;
}

interface DiscountRule {
  payment_days: number;
  discount_percent: number;
}

type DiscountRulesField = {
  state: {
    value: DiscountRule[];
  };
  pushValue: (value: DiscountRule) => void;
  removeValue: (index: number) => void;
};

export function DiscountForm({ form }: DiscountFormProps) {
  return (
    <div className="space-y-6">
      <form.Field
        name="title"
        validators={{
          onChange: ({ value }) =>
            String(value ?? "").trim() ? undefined : "Title is required",
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Title *</Label>
            <Input
              id={field.name}
              name={field.name}
              value={String(field.state.value ?? "")}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Enter discount table title"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors.join(", ")}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form.Field name="effective_from">
          {(field) => (
            <DateField
              label="Effective From"
              required
              value={String(field.state.value ?? "")}
              onChange={(value) => field.handleChange(value)}
            />
          )}
        </form.Field>

        <form.Field name="effective_to">
          {(field) => (
            <DateField
              label="Effective To"
              value={String(field.state.value ?? "")}
              onChange={(value) => field.handleChange(value)}
            />
          )}
        </form.Field>
      </div>

      <form.Field name="is_active">
        {(field) => (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(field.state.value)}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.checked)}
              className="size-4 rounded border"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        )}
      </form.Field>

      <div className="space-y-4 rounded-lg border p-4">
        <form.Field name="discount_rules" mode="array">
          {(field) => {
            const rulesField = field as unknown as DiscountRulesField;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Discount Rules</h3>
                    <p className="text-sm text-muted-foreground">
                      Define discounts based on payment days.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      rulesField.pushValue({
                        payment_days: 0,
                        discount_percent: 0,
                      })
                    }
                  >
                    Add Rule
                  </Button>
                </div>

                {rulesField.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 items-end gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <form.Field
                      name={`discount_rules[${index}].payment_days`}
                      validators={{
                        onChange: ({ value }) =>
                          Number(value) >= 0
                            ? undefined
                            : "Payment days cannot be negative",
                      }}
                    >
                      {(ruleField) => (
                        <div className="space-y-2">
                          <Label htmlFor={ruleField.name}>
                            Payment Within (Days)
                          </Label>
                          <Input
                            id={ruleField.name}
                            name={ruleField.name}
                            type="number"
                            min="0"
                            value={String(ruleField.state.value ?? 0)}
                            onBlur={ruleField.handleBlur}
                            onChange={(event) =>
                              ruleField.handleChange(Number(event.target.value))
                            }
                          />
                          {ruleField.state.meta.errors.length > 0 && (
                            <p className="text-sm text-destructive">
                              {ruleField.state.meta.errors.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field
                      name={`discount_rules[${index}].discount_percent`}
                      validators={{
                        onChange: ({ value }) =>
                          Number(value) >= 0 && Number(value) <= 100
                            ? undefined
                            : "Discount must be between 0 and 100",
                      }}
                    >
                      {(ruleField) => (
                        <div className="space-y-2">
                          <Label htmlFor={ruleField.name}>Discount (%)</Label>
                          <Input
                            id={ruleField.name}
                            name={ruleField.name}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={String(ruleField.state.value ?? 0)}
                            onBlur={ruleField.handleBlur}
                            onChange={(event) =>
                              ruleField.handleChange(Number(event.target.value))
                            }
                          />
                          {ruleField.state.meta.errors.length > 0 && (
                            <p className="text-sm text-destructive">
                              {ruleField.state.meta.errors.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => rulesField.removeValue(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                {rulesField.state.value.length === 0 && (
                  <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                    No discount rules added yet.
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}
