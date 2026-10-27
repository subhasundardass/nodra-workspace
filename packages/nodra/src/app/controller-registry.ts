import { Document } from "../core/document/document";
import type { DocTypeDefinition } from "../core/doctype/schema";

type ControllerModules = Record<string, Record<string, unknown>>;

type DocumentController = new (
  meta: DocTypeDefinition,
  data?: Record<string, unknown>,
) => Document;

/**
 * Registers DocType controller classes and creates document instances.
 *
 * Controller class names must match their DocType names:
 * Brand -> export class Brand extends Document
 */
export class DocTypeControllerRegistry {
  private readonly controllers = new Map<string, DocumentController>();

  registerModules(
    doctypes: DocTypeDefinition[],
    modules: ControllerModules,
  ): void {
    const controllersByName = new Map<string, DocumentController>();

    for (const mod of Object.values(modules)) {
      for (const [name, value] of Object.entries(mod)) {
        if (typeof value !== "function") {
          continue;
        }

        const prototype = value.prototype;

        if (
          !prototype ||
          (prototype !== Document.prototype && !(prototype instanceof Document))
        ) {
          continue;
        }

        controllersByName.set(name, value as DocumentController);
      }
    }

    for (const doctype of doctypes) {
      const controller = controllersByName.get(doctype.name);

      if (controller) {
        this.controllers.set(doctype.name, controller);
      }
    }
  }

  create(
    meta: DocTypeDefinition,
    data: Record<string, unknown> = {},
  ): Document {
    const Controller = this.controllers.get(meta.name);

    if (!Controller) {
      return new Document(meta, data);
    }

    return new Controller(meta, data);
  }

  has(doctype: string): boolean {
    return this.controllers.has(doctype);
  }
}
