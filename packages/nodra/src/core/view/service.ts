import type { DocTypeRegistry } from "../doctype/registry.js";
import { ViewRegistry } from "./registry.js";
import { ViewResolver } from "./resolver.js";
import type { ViewDefinition, ViewType } from "./schema.js";
import { validateView } from "./validator.js";

export class ViewService {
  private readonly registry: ViewRegistry;
  private readonly resolver: ViewResolver;
  private readonly doctypeRegistry: DocTypeRegistry;

  constructor(
    doctypeRegistry: DocTypeRegistry,
    viewRegistry = new ViewRegistry(),
  ) {
    this.doctypeRegistry = doctypeRegistry;
    this.registry = viewRegistry;
    this.resolver = new ViewResolver(viewRegistry, doctypeRegistry);
  }

  /**
   * Register a custom view after validating it against its DocType.
   */
  registerView(view: ViewDefinition): void {
    const doctype = this.doctypeRegistry.get(view.doctype);

    validateView(view, doctype);
    this.registry.register(view);
  }

  /**
   * Remove a registered custom view.
   */
  unregisterView(doctype: string, type: ViewType, name: string): boolean {
    return this.registry.unregister(doctype, type, name);
  }

  /**
   * Resolve a view for a DocType and view type.
   */
  getView(doctype: string, type: ViewType): ViewDefinition {
    return this.resolver.resolve(doctype, type);
  }

  getListView(doctype: string): ViewDefinition {
    return this.getView(doctype, "list");
  }

  getFormView(doctype: string): ViewDefinition {
    return this.getView(doctype, "form");
  }

  getDetailView(doctype: string): ViewDefinition {
    return this.getView(doctype, "detail");
  }

  getSearchView(doctype: string): ViewDefinition {
    return this.getView(doctype, "search");
  }

  /**
   * Resolve a specifically named view.
   */
  getNamedView(
    doctype: string,
    type: ViewType,
    name: string,
  ): ViewDefinition | undefined {
    return this.resolver.resolveNamed(doctype, type, name);
  }
}
