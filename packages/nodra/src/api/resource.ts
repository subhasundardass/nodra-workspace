/**src/api/resource.ts */
/**
 * app.resource.get("Loan", name)
app.resource.list("Loan", options)
app.resource.create("Loan", data)
app.resource.update("Loan", name, data)
app.resource.delete("Loan", name)
 */

/**
 * Nodra Framework - Resource API
 *
 * Thin application-facing API for standard DocType CRUD operations.
 *
 * Resource is intentionally not another service layer. It delegates
 * persistence and lifecycle behavior to ORM.
 */

import type { DocTypeRegistry } from "../core/doctype/registry.js";
import { Document } from "../core/document/document.js";
import type { ORM, ListOptions } from "../orm/crud.js";

export interface ResourceListOptions extends ListOptions {}

export interface ResourceListResult {
  data: Document[];
  meta: {
    total_count: number;
    limit?: number;
    offset?: number;
  };
}

/**
 * Creates a Document instance for a DocType.
 *
 * Applications can provide a factory that returns their actual DocType
 * controller, e.g. `Todo extends Document`, so lifecycle hooks are preserved.
 */
export type DocumentFactory = (
  doctype: string,
  data: Record<string, unknown>,
) => Document;

/**
 * Standard CRUD API for Nodra resources.
 *
 * Resource delegates all persistence, validation and lifecycle behavior
 * to the ORM.
 */
export class ResourceAPI {
  private readonly orm: ORM;
  private readonly registry: DocTypeRegistry;
  private readonly documentFactory: DocumentFactory;

  constructor(
    orm: ORM,
    registry: DocTypeRegistry,
    documentFactory?: DocumentFactory,
  ) {
    this.orm = orm;
    this.registry = registry;
    this.documentFactory =
      documentFactory ??
      ((doctype, data) => {
        const meta = this.registry.get(doctype);
        return new Document(meta, data);
      });
  }

  /**
   * Get a single document by name.
   */
  async get(doctype: string, name: string): Promise<Document> {
    return this.orm.getDoc(doctype, name);
  }

  /**
   * Get a paginated list of documents.
   */
  async list(
    doctype: string,
    options?: ResourceListOptions,
  ): Promise<ResourceListResult> {
    const [data, totalCount] = await Promise.all([
      this.orm.getList(doctype, options),
      this.orm.getCount(doctype, options?.filters),
    ]);

    return {
      data,
      meta: {
        total_count: totalCount,
        ...(options?.limit !== undefined ? { limit: options.limit } : {}),
        ...(options?.offset !== undefined ? { offset: options.offset } : {}),
      },
    };
  }

  /**
   * Create a new document.
   *
   * The application document factory is used so custom DocType
   * controllers can participate in the ORM lifecycle.
   */
  async create(
    doctype: string,
    data: Record<string, unknown>,
  ): Promise<Document> {
    // Validate that the DocType exists before constructing the document.
    this.registry.get(doctype);

    const doc = this.documentFactory(doctype, data);

    return this.orm.insert(doc);
  }

  /**
   * Update an existing document.
   *
   * The existing document is loaded first so its previous state is
   * available to lifecycle hooks.
   */
  async update(
    doctype: string,
    name: string,
    data: Record<string, unknown>,
  ): Promise<Document> {
    const doc = await this.orm.getDoc(doctype, name);

    for (const [fieldname, value] of Object.entries(data)) {
      doc.set(fieldname, value);
    }

    return this.orm.update(doc);
  }

  /**
   * Delete an existing document.
   */
  async delete(doctype: string, name: string): Promise<void> {
    await this.orm.deleteDoc(doctype, name);
  }
}
