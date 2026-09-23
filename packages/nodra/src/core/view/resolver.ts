import type { ViewDefinition, ViewType } from "./schema.js";
import { ViewRegistry } from "./registry.js";

/**
 * Resolves the view that should be used for a DocType.
 *
 * Custom application views take precedence.
 * Default views are supplied by the framework when no custom
 * view has been registered.
 */
export class ViewResolver {
  constructor(private readonly registry: ViewRegistry) {}

  resolve(doctype: string, type: ViewType): ViewDefinition | undefined {
    const views = this.registry.getAll(doctype, type);

    if (views.length === 0) {
      return undefined;
    }

    return views.find((view) => view.default) ?? views[0];
  }

  resolveNamed(
    doctype: string,
    type: ViewType,
    name: string,
  ): ViewDefinition | undefined {
    return this.registry.get(doctype, type, name);
  }
}
