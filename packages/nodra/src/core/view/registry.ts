import { DuplicateError } from "../errors.js";
import type { ViewDefinition, ViewType } from "./schema.js";

/**
 * Registry of application-defined views.
 *
 * The registry is framework-level infrastructure.
 * Actual view definitions belong to the application.
 */
export class ViewRegistry {
  private readonly views = new Map<string, ViewDefinition>();

  register(view: ViewDefinition): void {
    const key = this.getKey(view.doctype, view.type, view.name);

    if (this.views.has(key)) {
      throw new DuplicateError(view.doctype, view.name);
    }

    this.views.set(key, view);
  }

  unregister(doctype: string, type: ViewType, name: string): boolean {
    return this.views.delete(this.getKey(doctype, type, name));
  }

  get(
    doctype: string,
    type: ViewType,
    name: string,
  ): ViewDefinition | undefined {
    return this.views.get(this.getKey(doctype, type, name));
  }

  getAll(doctype?: string, type?: ViewType): ViewDefinition[] {
    return [...this.views.values()].filter((view) => {
      if (doctype && view.doctype !== doctype) {
        return false;
      }

      if (type && view.type !== type) {
        return false;
      }

      return true;
    });
  }

  clear(): void {
    this.views.clear();
  }

  private getKey(doctype: string, type: ViewType, name: string): string {
    return `${doctype}:${type}:${name}`;
  }
}
