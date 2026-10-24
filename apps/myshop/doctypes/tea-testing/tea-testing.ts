/**
 * TeaTesting DocType Controller
 *
 * Override the lifecycle hooks below for custom validation/behavior.
 * ORM operations (app.orm.insert/update/deleteDoc) call these automatically
 * — see the ORM's insert()/update() for the exact order they run in.
 */
import { Document } from "nodra/core/document/document";

export class TeaTesting extends Document {
  title!: string;

  // async beforeValidate(): Promise<void> {
  //   // throw a ValidationError here to reject bad input before it's saved
  // }

  // async beforeInsert(): Promise<void> {}
  // async afterInsert(): Promise<void> {}
  // async beforeSave(): Promise<void> {}
  // async afterSave(): Promise<void> {}

  /**
   * Validate TeaTesting data before insert or update.
   */
  async beforeValidate(): Promise<void> {
    const lot = this.get("lots");
    const sampleDate = this.get("sample_date");
    const qualityScore = this.get("quality_score");

    if (typeof lot !== "string" || !lot.trim()) {
      throw new Error("Lot is required.");
    }

    if (!sampleDate) {
      throw new Error("Testing Date is required.");
    }

    if (
      qualityScore !== undefined &&
      qualityScore !== null &&
      qualityScore !== ""
    ) {
      const score = Number(qualityScore);

      if (!Number.isFinite(score) || score < 1 || score > 10) {
        throw new Error("Quality Score must be between 1 and 10.");
      }
    }
  }
}
