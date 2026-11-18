/**
 * TeaValuation DocType Controller
 *
 * Override the lifecycle hooks below for custom validation/behavior.
 * ORM operations (app.orm.insert/update/deleteDoc) call these automatically
 * — see the ORM's insert()/update() for the exact order they run in.
 */
import { Document } from "nodra/core/document/document";

export class TeaValuation extends Document {
  title!: string;

  // async beforeValidate(): Promise<void> {
  //   // throw a ValidationError here to reject bad input before it's saved
  // }

  // async beforeInsert(): Promise<void> {}
  // async afterInsert(): Promise<void> {}
  // async beforeSave(): Promise<void> {}
  // async afterSave(): Promise<void> {}

  /**
   * Validate TeaValuation data before insert or update.
   */
  async beforeValidate(): Promise<void> {
    this.normalizeNumberField("reference_rate");
    this.normalizeNumberField("final_rate");
    this.normalizeNumberField("valuation_weight");

    const referenceRate = this.get("reference_rate");
    const finalRate = this.get("final_rate");
    const weight = this.get("valuation_weight");

    this.validateNonNegativeNumber("Reference Rate", referenceRate);
    this.validateNonNegativeNumber("Final Rate", finalRate);
    this.validateNonNegativeNumber("Valuation Weight", weight);

    if (typeof weight === "number" && typeof finalRate === "number") {
      this.set("estimated_value", weight * finalRate);
    } else {
      this.set("estimated_value", 0);
    }

    this.normalizeNumberField("estimated_value");
  }

  /** Before Save */
  async beforeSave(): Promise<void> {
    const weight = Number(this.get("valuation_weight") ?? 0);
    const rate = Number(this.get("final_rate") ?? 0);

    if (!Number.isFinite(weight) || !Number.isFinite(rate)) {
      throw new Error("Valuation weight and final rate must be valid numbers.");
    }

    this.set("estimated_value", weight * rate);
  }
  private normalizeNumberField(fieldName: string): void {
    const value = this.get(fieldName);

    if (value === undefined || value === null || value === "") {
      return;
    }

    if (typeof value === "string" && value.trim() === "") {
      this.set(fieldName, null);
      return;
    }

    const numberValue = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(numberValue)) {
      throw new Error(`${fieldName} must be a valid number.`);
    }

    this.set(fieldName, numberValue);
  }

  private validateNonNegativeNumber(label: string, value: unknown): void {
    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    ) {
      throw new Error(`${label} must be a valid non-negative number.`);
    }
  }
}
