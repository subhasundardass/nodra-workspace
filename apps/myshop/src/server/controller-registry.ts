import { Document } from "nodra/core/document/document.js";
import type { DocTypeDefinition } from "nodra";

export type DocumentController = new (
  meta: DocTypeDefinition,
  data?: Record<string, unknown>,
) => Document;

export class DocTypeControllerRegistry {
  private readonly controllers = new Map<string, DocumentController>();

  register(doctype: string, controller: DocumentController): void {
    this.controllers.set(doctype, controller);
  }

  registerModules(
    doctypes: DocTypeDefinition[],
    modules: Record<string, Record<string, unknown>>,
  ): void {
    for (const meta of doctypes) {
      const folder = meta.name
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/\s+/g, "-")
        .toLowerCase();

      const suffix = `/${folder}/${folder}.ts`;

      const module = Object.entries(modules).find(([path]) =>
        path.endsWith(suffix),
      )?.[1];

      if (!module) continue;

      const controller = Object.values(module).find(
        (value): value is DocumentController =>
          typeof value === "function" &&
          value.prototype instanceof Document &&
          value.name === meta.name,
      );

      if (controller) {
        this.register(meta.name, controller);
      }
    }
  }

  get(doctype: string): DocumentController | undefined {
    return this.controllers.get(doctype);
  }

  create(
    meta: DocTypeDefinition,
    data: Record<string, unknown> = {},
  ): Document {
    const Controller = this.get(meta.name);

    return Controller ? new Controller(meta, data) : new Document(meta, data);
  }
}
