import type { DocTypeRegistry } from "../doctype/registry.js";
import type { ViewDefinition, ViewType } from "./schema.js";
import { ViewRegistry } from "./registry.js";
import { createDefaultView } from "./defaults.js";

/**
 * Resolves custom views first and generates metadata-driven
 * defaults otherwise.
 */
export class ViewResolver {
  constructor(
    private readonly registry: ViewRegistry,
    private readonly doctypeRegistry: DocTypeRegistry,
  ) {}

  resolve(doctype: string, type: ViewType): ViewDefinition {
    const views = this.registry.getAll(doctype, type);

    const custom = views.find((view) => view.default) ?? views[0];

    if (custom) {
      return custom;
    }

    return createDefaultView(this.doctypeRegistry.get(doctype), type);
  }

  resolveNamed(
    doctype: string,
    type: ViewType,
    name: string,
  ): ViewDefinition | undefined {
    return this.registry.get(doctype, type, name);
  }
}
