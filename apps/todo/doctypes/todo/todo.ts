/**
 * Todo DocType Controller
 *
 * Override the lifecycle hooks below for custom validation/behavior.
 * ORM operations (app.orm.insert/update/deleteDoc) call these automatically
 * — see the ORM's insert()/update() for the exact order they run in.
 */
import { Document } from 'nodra/core/document/document.js';

export class Todo extends Document {
  title!: string;

  // async beforeValidate(): Promise<void> {
  //   // throw a ValidationError here to reject bad input before it's saved
  // }

  // async beforeInsert(): Promise<void> {}
  // async afterInsert(): Promise<void> {}
  // async beforeSave(): Promise<void> {}
  // async afterSave(): Promise<void> {}
}
