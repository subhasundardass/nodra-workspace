import type { MethodRegistry } from "../api/method";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { hasPermission } from "../permissions/permission";
import type { PermissionAction } from "../permissions/permission";
import { PermissionError, ValidationError } from "../core/errors";
import type { Filters } from "../orm/crud";

type MethodUser = {
  email: string;
  roles: string[];
} | null;

type DocumentData = Record<string, unknown>;

type DocumentLike = {
  getData(): DocumentData;
};

const FILTER_OPERATORS = new Set([
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "like",
  "not like",
  "in",
  "not in",
  "between",
  "is",
]);

export interface DocumentMethodApp {
  registry: {
    get(name: string): DocTypeDefinition;
  };

  orm: {
    getDoc(doctype: string, name: string): Promise<DocumentLike>;

    getList(
      doctype: string,
      options?: {
        limit?: number;
        offset?: number;
        orderBy?: string;
        fields?: string[];
        filters?: Filters;
        orFilters?: Filters;
      },
    ): Promise<DocumentLike[]>;

    transition(doc: DocumentLike, action: string): Promise<DocumentLike>;
  };

  resource: {
    create(doctype: string, data: DocumentData): Promise<DocumentLike>;

    update(
      doctype: string,
      name: string,
      data: DocumentData,
    ): Promise<DocumentLike>;

    delete(doctype: string, name: string): Promise<void>;
  };
}

function assertPermission(
  meta: DocTypeDefinition,
  action: PermissionAction,
  user: MethodUser,
  owner?: string,
): void {
  if (!user || !hasPermission(meta, action, user, owner)) {
    throw new PermissionError(
      meta.name,
      action,
      `You do not have permission to ${action} ${meta.name}`,
    );
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`"${field}" is required`);
  }

  return value.trim();
}

//--Filter

function getFilters(value: unknown, field: string): Filters | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  // Supports tuple filters:
  // ["bags", ">=", 100]
  // ["Lots", "bags", ">=", 100]
  if (Array.isArray(value)) {
    const valid = value.every((filter: unknown) => {
      if (!Array.isArray(filter)) return false;

      const isShortTuple = filter.length === 3;
      const isLongTuple = filter.length === 4;

      if (!isShortTuple && !isLongTuple) return false;

      const fieldIndex = isShortTuple ? 0 : 1;
      const operatorIndex = isShortTuple ? 1 : 2;

      const filterField = filter[fieldIndex];
      const operator = filter[operatorIndex];

      return (
        typeof filterField === "string" &&
        typeof operator === "string" &&
        FILTER_OPERATORS.has(operator.toLowerCase()) &&
        (isShortTuple || typeof filter[0] === "string")
      );
    });

    if (!valid) {
      throw new ValidationError(`"${field}" contains an invalid filter tuple`);
    }

    return value as Filters;
  }

  // Supports simple object filters:
  // { factory: "FACTORY-0001" }
  // { bags: [">=", 100] }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  throw new ValidationError(
    `"${field}" must be an object or an array of filter tuples`,
  );
}

function getDocumentData(value: unknown): DocumentData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError('"doc" must be an object');
  }

  return value as DocumentData;
}

function getOwner(doc: DocumentLike): string | undefined {
  const owner = doc.getData().owner;

  return typeof owner === "string" ? owner : undefined;
}

export function registerDocumentMethods(
  registry: MethodRegistry,
  getApp: () => Promise<DocumentMethodApp>,
): void {
  // --------------------------------------------------
  // Transition document workflow
  // --------------------------------------------------
  /**
   * await callMethod("document.transition", {
   *   doctype: "Lot",
   *   name: lotName,
   *   action: "Confirm",
   * });
   */
  registry.register(
    "document.transition",
    async (ctx) => {
      const doctype = requiredString(ctx.args.doctype, "doctype");
      const name = requiredString(ctx.args.name, "name");
      const action = requiredString(ctx.args.action, "action");

      const app = await getApp();
      const meta = app.registry.get(doctype);

      // Load the latest document.
      const existing = await app.orm.getDoc(doctype, name);

      // Check document write permission.
      assertPermission(meta, "write", ctx.user, getOwner(existing));

      // The ORM validates the workflow action and role,
      // updates workflow_state and docstatus, and persists
      // the change inside a transaction.
      const doc = await app.orm.transition(existing, action);

      return {
        document: doc.getData(),
      };
    },
    { requireAuth: true },
  );

  // --------------------------------------------------
  // Get one document
  // --------------------------------------------------
  /**
   const result = await callMethod("document.get", {
    doctype: "Lots",
    name: "LOT-0001",
  });
   */
  registry.register(
    "document.get",
    async (ctx) => {
      const doctype = requiredString(ctx.args.doctype, "doctype");
      const name = requiredString(ctx.args.name, "name");

      const app = await getApp();
      const meta = app.registry.get(doctype);
      const doc = await app.orm.getDoc(doctype, name);

      assertPermission(meta, "read", ctx.user, getOwner(doc));

      return { document: doc.getData() };
    },
    { requireAuth: true },
  );

  // --------------------------------------------------
  // List documents
  // --------------------------------------------------
  registry.register(
    "document.list",
    async (ctx) => {
      const doctype = requiredString(ctx.args.doctype, "doctype");

      const app = await getApp();
      const meta = app.registry.get(doctype);

      assertPermission(meta, "read", ctx.user);

      const requestedLimit = Number(ctx.args.limit ?? 20);
      const requestedOffset = Number(ctx.args.offset ?? 0);

      const limit = Number.isFinite(requestedLimit)
        ? Math.max(1, Math.min(100, Math.trunc(requestedLimit)))
        : 20;

      const offset = Number.isFinite(requestedOffset)
        ? Math.max(0, Math.trunc(requestedOffset))
        : 0;

      const orderBy = meta.sort_field
        ? `${meta.sort_field} ${meta.sort_order ?? "asc"}`
        : "modified desc";

      //--Linked Field
      const fields = Array.isArray(ctx.args.fields)
        ? ctx.args.fields.filter(
            (field): field is string => typeof field === "string",
          )
        : undefined;

      const filters = getFilters(ctx.args.filters, "filters");
      const orFilters = getFilters(ctx.args.orFilters, "orFilters");

      const docs = await app.orm.getList(doctype, {
        limit,
        offset,
        orderBy,
        fields,
        filters,
        orFilters,
      });

      return {
        documents: docs.map((doc) => doc.getData()),
        limit,
        offset,
      };
    },
    { requireAuth: true },
  );

  // --------------------------------------------------
  // Create document
  // --------------------------------------------------
  /**
  await callMethod("document.create", {
    doctype: "Factory",
    doc: values,
  });
   */
  registry.register(
    "document.create",
    async (ctx) => {
      const doctype = requiredString(ctx.args.doctype, "doctype");
      const docData = getDocumentData(ctx.args.doc);

      const app = await getApp();
      const meta = app.registry.get(doctype);

      assertPermission(meta, "create", ctx.user);

      const doc = await app.resource.create(doctype, docData);

      return { document: doc.getData() };
    },
    { requireAuth: true },
  );

  // --------------------------------------------------
  // Update document
  // --------------------------------------------------
  /**
   await callMethod("document.update", {
    doctype: "Factory",
    name: factoryName,
    doc: values,
  });
   */
  registry.register(
    "document.update",
    async (ctx) => {
      const doctype = requiredString(ctx.args.doctype, "doctype");
      const name = requiredString(ctx.args.name, "name");
      const docData = getDocumentData(ctx.args.doc);

      const app = await getApp();
      const meta = app.registry.get(doctype);
      const existing = await app.orm.getDoc(doctype, name);

      assertPermission(meta, "write", ctx.user, getOwner(existing));

      const doc = await app.resource.update(doctype, name, docData);

      return { document: doc.getData() };
    },
    { requireAuth: true },
  );

  // --------------------------------------------------
  // Delete document
  // --------------------------------------------------
  /**
   await callMethod("document.delete", {
    doctype: "Factory",
    name: factoryName,
  });
   */
  registry.register(
    "document.delete",
    async (ctx) => {
      const doctype = requiredString(ctx.args.doctype, "doctype");
      const name = requiredString(ctx.args.name, "name");

      const app = await getApp();
      const meta = app.registry.get(doctype);
      const existing = await app.orm.getDoc(doctype, name);

      assertPermission(meta, "delete", ctx.user, getOwner(existing));

      await app.resource.delete(doctype, name);

      return {
        deleted: true,
        doctype,
        name,
      };
    },
    { requireAuth: true },
  );

  // --------------------------------------------------
  // Get document audit history
  // --------------------------------------------------
  /**
   * await callMethod("document.get_audit_history", {
   *   doctype: "Lots",
   *   name: "LOT-0001",
   * });
   */
  registry.register(
    "document.get_audit_history",
    async (ctx) => {
      const doctype = requiredString(ctx.args.doctype, "doctype");
      const name = requiredString(ctx.args.name, "name");

      const app = await getApp();

      // Verify the requested document exists and the user can read it.
      const meta = app.registry.get(doctype);
      const doc = await app.orm.getDoc(doctype, name);

      assertPermission(meta, "read", ctx.user, getOwner(doc));

      // Read audit records for this document only.
      const logs = await app.orm.getList("Audit Log", {
        filters: {
          reference_doctype: doctype,
          reference_name: name,
        },
        orderBy: "creation desc",
        limit: 100,
      });

      return {
        activities: logs.map((log) => log.getData()),
      };
    },
    { requireAuth: true },
  );
}
