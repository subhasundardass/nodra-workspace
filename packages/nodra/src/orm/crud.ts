/**
 * Nodra Framework - ORM CRUD Layer
 *
 * Backward compatible: calls that worked before still run through the ORIGINAL
 * code path. Everything new is additive or opt-in:
 *
 *   1. Session user        runWithSession({ user, roles }, fn)  -> owner / modified_by
 *   2. Permissions         { enforcePermissions: true }  (doctype `permissions` + userPermissions)
 *   3. Naming series       doctype `autoname`: "series:LOAN-.YYYY.-.####" | "field:x" | "hash" | "prompt"
 *   4. Stale-modified      { staleCheck: true }  -> StaleDocumentError
 *   5. Submit / cancel     doctype `is_submittable`  -> orm.submit(doc) / orm.cancel(doc)
 *   6. group_by + aggregates  fields: ['sum(amount) as total'], groupBy: 'status'
 *   +  Frappe filters, Link dot-paths of any depth, opt-in child tables / link validation.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { Database } from "../database/connection";
import type { DocTypeRegistry } from "../core/doctype/registry";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { Document } from "../core/document/document";
import { validateDocument } from "../core/validation/validator";
import { toTableName } from "../core/doctype/naming";
import { generateHash } from "../core/doctype/naming";
import { NotFoundError } from "../core/errors";
import { QueryBuilder } from "../database/query-builder";
import { withTransaction } from "../database/transaction";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}
/** Someone else saved this document after you loaded it. */
export class StaleDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaleDocumentError";
  }
}
export class DocStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocStatusError";
  }
}

// ---------------------------------------------------------------------------
// Session context (AsyncLocalStorage)
// ---------------------------------------------------------------------------

export interface SessionContext {
  user: string;
  roles: string[];
  /** e.g. { Branch: ['BR-01'] } -> user only sees docs linked to that branch. */
  userPermissions?: Record<string, string[]>;
}

// Kept on globalThis so the session is visible even if this module gets loaded
// twice (e.g. via "nodra" and "nodra/orm/crud.js" under Vite/Nitro).
const SESSION_KEY = Symbol.for("nodra.sessionStore");
const g = globalThis as unknown as {
  [SESSION_KEY]?: AsyncLocalStorage<SessionContext>;
};
const sessionStore = (g[SESSION_KEY] ??=
  new AsyncLocalStorage<SessionContext>());

/** Run `fn` (e.g. your request handler) as this user. */
export function runWithSession<T>(ctx: SessionContext, fn: () => T): T {
  return sessionStore.run(ctx, fn);
}
export function getSession(): SessionContext | undefined {
  return sessionStore.getStore();
}
/** For scripts, migrations, seeders when enforcePermissions is on. */
export function runAsAdministrator<T>(fn: () => T): T {
  return sessionStore.run(
    { user: "Administrator", roles: ["Administrator"] },
    fn,
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Operator =
  | "="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "like"
  | "not like"
  | "in"
  | "not in"
  | "between"
  | "is";

export type FilterTuple =
  | [field: string, op: Operator, value: unknown]
  | [doctype: string, field: string, op: Operator, value: unknown];

/** A plain object (as before) or a Frappe tuple list. */
export type Filters = Record<string, unknown> | FilterTuple[];

/**
 * Options for the getList operation.
 */
export interface ListOptions {
  filters?: Filters;
  orFilters?: Filters;
  /** 'name', '*', 'member.member_name', 'sum(amount) as total', 'count(*)' */
  fields?: string[];
  orderBy?: string;
  /** 'status' or 'member.group.branch, status' */
  groupBy?: string;
  distinct?: boolean;
  limit?: number;
  offset?: number;
}

export interface ORMOptions {
  /** Load/save/delete rows of Table fields in child tables. Default: false. */
  childTables?: boolean;
  /** Check that Link / Dynamic Link targets exist before insert/update. Default: false. */
  validateLinks?: boolean;
  /** Enforce doctype `permissions` + session userPermissions. Default: false. */
  enforcePermissions?: boolean;
  /** Reject saves when the row changed since the document was loaded. Default: false. */
  staleCheck?: boolean;
  /** Override where the session comes from (default: runWithSession / AsyncLocalStorage). */
  getSession?: () => SessionContext | undefined;
}

/** Shape read from doctype meta (all optional, cast so your schema type needs no change). */
interface PermRule {
  role: string;
  read?: boolean;
  write?: boolean;
  create?: boolean;
  delete?: boolean;
  submit?: boolean;
  cancel?: boolean;
  if_owner?: boolean;
}
type PType = "read" | "write" | "create" | "delete" | "submit" | "cancel";
type Mode = "update" | "submit" | "cancel";

type Row = Record<string, unknown>;
/** What the ORM needs from either the pool-backed Database or a transaction client. */
interface Queryable {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
  queryOne<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<number>;
}
type Field = DocTypeDefinition["fields"][number];
interface Cond {
  doctype?: string;
  field: string;
  op: Operator;
  value: unknown;
}

/** Default user for auto-populated fields when no session context is available. */
const DEFAULT_USER = "Administrator";

const OPS = new Set([
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
const NO_COLUMN = new Set([
  "Table",
  "Table MultiSelect",
  "Section Break",
  "Column Break",
  "Tab Break",
  "HTML",
  "Button",
  "Heading",
]);
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const AGG =
  /^(count|sum|avg|min|max)\(\s*(distinct\s+)?(\*|[A-Za-z_][A-Za-z0-9_.]*)\s*\)(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?$/i;

const ftype = (f: Field): string => f.fieldtype as string;
const isTable = (f: Field): boolean =>
  ftype(f) === "Table" || ftype(f) === "Table MultiSelect";
const hasColumn = (f: Field): boolean => !NO_COLUMN.has(ftype(f));
const opts = (f: Field): string =>
  (f as { options?: string }).options as string;
const allowOnSubmit = (f: Field): boolean =>
  !!(f as { allow_on_submit?: boolean }).allow_on_submit;
const toMs = (v: unknown): number =>
  v instanceof Date ? v.getTime() : new Date(v as string).getTime();
const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Validate an identifier (injection-safe). Lowercase names are quoted, others left as-is. */
function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Invalid field name: ${name}`);
  return /[A-Z]/.test(name) ? name : `"${name}"`;
}

function isOpValue(v: unknown): v is [string, unknown] {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "string" &&
    OPS.has(v[0].toLowerCase())
  );
}

/** True when the call uses anything the original ORM could not do. */
function isAdvanced(o?: Partial<ListOptions>): boolean {
  if (!o) return false;
  if (o.orFilters || o.groupBy || o.distinct) return true;
  if (Array.isArray(o.filters)) return true;
  if (o.filters) {
    for (const [k, v] of Object.entries(o.filters)) {
      if (k.includes(".") || isOpValue(v)) return true;
    }
  }
  if (o.fields?.some((f) => f.includes(".") || f.includes("("))) return true;
  if (o.orderBy && (o.orderBy.includes(".") || o.orderBy.includes(",")))
    return true;
  return false;
}

function normalize(filters?: Filters): Cond[] {
  if (!filters) return [];
  if (Array.isArray(filters)) {
    return filters.map((f) =>
      f.length === 4
        ? { doctype: f[0], field: f[1], op: f[2], value: f[3] }
        : { field: f[0], op: f[1] as Operator, value: f[2] },
    );
  }
  return Object.entries(filters).map(([field, v]) =>
    isOpValue(v)
      ? { field, op: v[0].toLowerCase() as Operator, value: v[1] }
      : { field, op: "=" as Operator, value: v },
  );
}

class Ctx {
  params: unknown[] = [];
  joins = new Map<string, string>();
  p(v: unknown): string {
    this.params.push(v);
    return `$${this.params.length}`;
  }
}

// ---------------------------------------------------------------------------
// ORM
// ---------------------------------------------------------------------------

/**
 * High-level ORM providing CRUD operations with lifecycle hooks and validation.
 */
export class ORM {
  private readonly db: Database;
  private readonly registry: DocTypeRegistry;
  private readonly options: ORMOptions;
  /** Where queries run: the pool-backed Database, or one transaction client. */
  private q: Queryable;
  private inTx = false;
  /** Shared with transaction-scoped copies so the series table is created once. */
  private seriesState: { ready?: Promise<void> } = {};

  constructor(
    db: Database,
    registry: DocTypeRegistry,
    options: ORMOptions = {},
  ) {
    this.db = db;
    this.q = db;
    this.registry = registry;
    this.options = options;
  }

  /**
   * Run several ORM calls in ONE database transaction (BEGIN ... COMMIT, ROLLBACK on throw).
   * `fn` receives an ORM bound to the transaction; use it for every call that must be atomic.
   * Calling transaction() on that ORM again joins the same transaction (no nesting).
   *
   *   await app.orm.transaction(async (tx) => {
   *     await tx.insert(loan);
   *     await tx.submit(loan);
   *   });
   */
  async transaction<T>(fn: (orm: ORM) => Promise<T>): Promise<T> {
    if (this.inTx) return fn(this);
    return withTransaction(this.db, (client) => {
      const scoped = new ORM(this.db, this.registry, this.options);
      scoped.q = client;
      scoped.inTx = true;
      scoped.seriesState = this.seriesState;
      return fn(scoped);
    });
  }

  get database(): Database {
    return this.db;
  }

  // ===========================================================================
  // insert
  // ===========================================================================

  /**
   * Lifecycle: beforeValidate → validate → beforeInsert → beforeSave → DB INSERT → afterSave → afterInsert
   */
  async insert(doc: Document): Promise<Document> {
    const meta = this.registry.get(doc.doctype);
    const now = new Date();
    const user = this.user();

    const a = this.access(meta, "create");

    // Naming: legacy (hash) happens now; doctypes with `autoname` are named after validation.
    const autoname = this.autoname(meta);
    if (!doc.name && !autoname) {
      doc.name = this.generateName(meta);
    }
    if (!doc.owner) {
      doc.owner = user ?? DEFAULT_USER;
    }
    if (!a.bypass && user) doc.owner = user; // enforced: cannot create on behalf of others
    doc.creation = now;
    doc.modified = now;
    if (user) {
      doc.modified_by = user;
    } else if (!doc.modified_by) {
      doc.modified_by = doc.owner;
    }
    if (this.isSubmittable(meta)) doc.docstatus = 0;

    // Lifecycle: pre-validation
    await doc.beforeValidate();
    await doc.validate();

    // Framework validation
    validateDocument(doc, meta);
    if (this.options.validateLinks) await this.validateLinks(doc, meta);
    this.checkUserPerms(meta, a.s, this.docGetter(doc));

    if (!doc.name && autoname) {
      doc.name = await this.nameFromAutoname(doc, autoname, now);
    }

    // Lifecycle: pre-insert/save
    await doc.beforeInsert();
    await doc.beforeSave();

    const withChildren = this.hasChildren(meta);
    await this.run(withChildren, async (db) => {
      const data = this.buildInsertData(doc, meta);
      const tableName = toTableName(doc.doctype);
      const qb = new QueryBuilder(tableName).insert(data);
      const { sql, params } = qb.build();

      const rows = await db.query<Row>(sql, params);
      const row = rows[0];

      // Apply returned data to document
      if (row) {
        this.applyRowToDocument(doc, row);
      }
      if (withChildren) await this.saveChildren(db, doc, meta, now);
    });

    // Mark as persisted
    doc.setIsNew(false);
    doc.markAsClean();

    // Lifecycle: post-save/insert
    await doc.afterSave();
    await doc.afterInsert();

    return doc;
  }

  // ===========================================================================
  // getDoc
  // ===========================================================================

  /**
   * @throws {NotFoundError} If the document does not exist.
   * @throws {PermissionError} If permissions are enforced and read is not allowed.
   */
  async getDoc(doctype: string, name: string): Promise<Document> {
    const meta = this.registry.get(doctype);
    const tableName = toTableName(doctype);

    const row = await this.q.queryOne<Row>(
      `SELECT * FROM ${tableName} WHERE name = $1`,
      [name],
    );

    if (!row) {
      throw new NotFoundError(doctype, name);
    }

    this.checkDocAccess(meta, "read", (k) => row[k]);

    const children = this.hasChildren(meta)
      ? await this.loadChildren(this.q, meta, name)
      : {};
    return this.rowToDocument(meta, row, children);
  }

  // ===========================================================================
  // getList  (returns Document[] exactly as before)
  // ===========================================================================

  async getList(doctype: string, options?: ListOptions): Promise<Document[]> {
    const meta = this.registry.get(doctype);

    // New features used, or permissions enforced -> new compiler
    if (isAdvanced(options) || this.options.enforcePermissions) {
      const rows = await this.queryRows(doctype, options ?? {});
      return rows.map((row) => this.rowToDocument(meta, row));
    }

    // ----- original code path (unchanged) -----
    const tableName = toTableName(doctype);

    const qb = new QueryBuilder(tableName);

    // Select fields
    if (options?.fields && options.fields.length > 0) {
      qb.select(...options.fields);
    } else {
      qb.select("*");
    }

    // Filters
    if (options?.filters) {
      for (const [key, value] of Object.entries(
        options.filters as Record<string, unknown>,
      )) {
        qb.where(key, "=", value);
      }
    }

    // Order by
    if (options?.orderBy) {
      const parts = options.orderBy.split(/\s+/);
      const column = parts[0]!;
      const direction = (
        parts[1]?.toLowerCase() === "desc" ? "desc" : "asc"
      ) as "asc" | "desc";
      qb.orderBy(column, direction);
    }

    // Pagination
    if (options?.limit !== undefined) {
      qb.limit(options.limit);
    }
    if (options?.offset !== undefined) {
      qb.offset(options.offset);
    }

    const { sql, params } = qb.build();
    const rows = await this.q.query<Row>(sql, params);

    return rows.map((row) => this.rowToDocument(meta, row));
  }

  /** Plain row objects. Use this for aggregates / group_by / joined columns. */
  async getAll(doctype: string, options: ListOptions = {}): Promise<Row[]> {
    return this.queryRows(doctype, options);
  }

  // ===========================================================================
  // update / submit / cancel
  // ===========================================================================

  /**
   * Lifecycle: beforeValidate → validate → beforeSave → DB UPDATE → afterSave → onChange
   */
  async update(doc: Document): Promise<Document> {
    return this.persist(doc, "update");
  }

  /** Draft (docstatus 0) -> Submitted (1). Needs doctype `is_submittable`. */
  async submit(doc: Document): Promise<Document> {
    return this.persist(doc, "submit");
  }

  /** Submitted (1) -> Cancelled (2). */
  async cancel(doc: Document): Promise<Document> {
    return this.persist(doc, "cancel");
  }

  private async persist(doc: Document, mode: Mode): Promise<Document> {
    const meta = this.registry.get(doc.doctype);
    const now = new Date();
    const tableName = toTableName(doc.doctype);
    const user = this.user();
    const submittable = this.isSubmittable(meta);
    const loadedModified: unknown = doc.modified;

    if (mode !== "update" && !submittable) {
      throw new DocStatusError(`${meta.name} is not submittable`);
    }
    const ptype: PType = mode === "update" ? "write" : mode;
    const a = this.access(meta, ptype);

    doc.modified = now;
    doc.modified_by = user ?? (doc.modified_by || DEFAULT_USER);

    if (mode !== "cancel") {
      // Lifecycle: pre-validation
      await doc.beforeValidate();
      await doc.validate();

      // Framework validation
      validateDocument(doc, meta);
      if (this.options.validateLinks) await this.validateLinks(doc, meta);
      this.checkUserPerms(meta, a.s, this.docGetter(doc));
    }
    if (mode === "update") await doc.beforeSave();
    if (mode === "submit") await this.hook(doc, "beforeSubmit");
    if (mode === "cancel") await this.hook(doc, "beforeCancel");

    const withChildren = this.hasChildren(meta);
    const needsStored =
      !!this.options.staleCheck ||
      submittable ||
      !!this.options.enforcePermissions;

    await this.run(withChildren || needsStored, async (db) => {
      let storedStatus = 0;

      if (needsStored) {
        const stored = await db.queryOne<Row>(
          `SELECT * FROM ${tableName} WHERE name = $1 FOR UPDATE`,
          [doc.name],
        );
        if (!stored) return; // same as before: updating a missing row is a no-op

        this.checkDocAccess(meta, ptype, (k) => stored[k]);

        if (
          this.options.staleCheck &&
          (loadedModified instanceof Date ||
            typeof loadedModified === "string") &&
          toMs(stored["modified"]) !== toMs(loadedModified)
        ) {
          throw new StaleDocumentError(
            `${meta.name} ${doc.name} was modified by ${String(stored["modified_by"])} after you loaded it. Reload and try again.`,
          );
        }

        storedStatus = Number(stored["docstatus"] ?? 0);
        if (submittable) {
          if (mode === "submit" && storedStatus !== 0)
            throw new DocStatusError(`${meta.name} ${doc.name} is not a draft`);
          if (mode === "cancel" && storedStatus !== 1)
            throw new DocStatusError(
              `${meta.name} ${doc.name} is not submitted`,
            );
          if (mode === "update" && storedStatus === 2)
            throw new DocStatusError(
              `${meta.name} ${doc.name} is cancelled and cannot be edited`,
            );
        }
      }

      // Build UPDATE data
      let data: Row;
      let onlyTables: Set<string> | undefined;
      if (mode === "cancel") {
        data = {
          modified: doc.modified,
          modified_by: doc.modified_by,
          docstatus: 2,
        };
      } else {
        data = this.buildUpdateData(doc, meta);
        if (mode === "submit") data["docstatus"] = 1;
        if (mode === "update" && submittable && storedStatus === 1) {
          // Submitted: only fields flagged allow_on_submit may change
          const ok = new Set(
            meta.fields.filter(allowOnSubmit).map((f) => f.fieldname),
          );
          for (const k of Object.keys(data)) {
            if (k !== "modified" && k !== "modified_by" && !ok.has(k))
              delete data[k];
          }
          onlyTables = ok;
        }
      }

      const qb = new QueryBuilder(tableName)
        .update(data)
        .where("name", "=", doc.name);
      const { sql, params } = qb.build();

      const rows = await db.query<Row>(sql + " RETURNING *", params);
      const row = rows[0];

      if (row) {
        this.applyRowToDocument(doc, row);
        if (withChildren && mode !== "cancel")
          await this.saveChildren(db, doc, meta, now, onlyTables);
      }
    });

    if (mode === "submit") doc.docstatus = 1;
    if (mode === "cancel") doc.docstatus = 2;
    doc.markAsClean();

    // Lifecycle: post-save + onChange
    if (mode === "update") {
      await doc.afterSave();
    } else if (mode === "submit") {
      await doc.afterSave();
      await this.hook(doc, "onSubmit");
    } else {
      await this.hook(doc, "onCancel");
    }
    await doc.onChange();

    return doc;
  }

  // ===========================================================================
  // deleteDoc
  // ===========================================================================

  /**
   * @throws {NotFoundError} If the document does not exist.
   * @throws {DocStatusError} If the document is submitted (cancel it first).
   */
  async deleteDoc(doctype: string, name: string): Promise<void> {
    const meta = this.registry.get(doctype);
    const doc = await this.getDoc(doctype, name);
    const tableName = toTableName(doctype);

    this.checkDocAccess(meta, "delete", this.docGetter(doc));
    if (this.isSubmittable(meta) && Number(doc.docstatus) === 1) {
      throw new DocStatusError(
        `${doctype} ${name} is submitted. Cancel it before deleting.`,
      );
    }

    // Lifecycle: pre-delete
    await doc.beforeDelete();

    const withChildren = this.hasChildren(meta);
    await this.run(withChildren, async (db) => {
      if (withChildren) {
        for (const f of meta.fields.filter(isTable)) {
          await db.execute(
            `DELETE FROM ${toTableName(opts(f))} WHERE parent = $1 AND parenttype = $2 AND parentfield = $3`,
            [name, meta.name, f.fieldname],
          );
        }
      }
      // DB DELETE
      await db.execute(`DELETE FROM ${tableName} WHERE name = $1`, [name]);
    });

    // Lifecycle: post-delete
    await doc.afterDelete();
  }

  // ===========================================================================
  // getCount  (count = alias)
  // ===========================================================================

  async getCount(
    doctype: string,
    filters?: Filters,
    orFilters?: Filters,
  ): Promise<number> {
    const meta = this.registry.get(doctype); // validate doctype exists
    const tableName = toTableName(doctype);

    if (isAdvanced({ filters, orFilters }) || this.options.enforcePermissions) {
      const ctx = new Ctx();
      const where = this.buildWhere(
        meta,
        filters,
        orFilters,
        ctx,
        this.permClauses(meta, ctx),
      );
      const joins = [...ctx.joins.values()].join(" ");
      const row = await this.q.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM ${tableName} t ${joins}${where}`,
        ctx.params,
      );
      return Number(row?.count ?? 0);
    }

    // ----- original code path (unchanged) -----
    const qb = new QueryBuilder(tableName).count();

    if (filters) {
      for (const [key, value] of Object.entries(
        filters as Record<string, unknown>,
      )) {
        qb.where(key, "=", value);
      }
    }

    const { sql, params } = qb.build();
    const row = await this.q.queryOne<{ count: string }>(sql, params);

    return Number(row?.count ?? 0);
  }

  /** Frappe-style alias of getCount. */
  count(
    doctype: string,
    filters?: Filters,
    orFilters?: Filters,
  ): Promise<number> {
    return this.getCount(doctype, filters, orFilters);
  }

  // ===========================================================================
  // getValue
  // ===========================================================================

  async getValue(
    doctype: string,
    nameOrFilters: string | Filters,
    fieldname: string | string[],
  ): Promise<unknown> {
    this.registry.get(doctype); // validate doctype exists

    if (
      typeof nameOrFilters === "string" &&
      typeof fieldname === "string" &&
      !this.options.enforcePermissions
    ) {
      const tableName = toTableName(doctype);
      const row = await this.q.queryOne<Row>(
        `SELECT ${this.safeColumn(fieldname)} FROM ${tableName} WHERE name = $1`,
        [nameOrFilters],
      );

      if (!row) {
        return undefined;
      }

      return row[fieldname];
    }

    const filters =
      typeof nameOrFilters === "string"
        ? { name: nameOrFilters }
        : nameOrFilters;
    const fields = Array.isArray(fieldname) ? fieldname : [fieldname];
    const [row] = await this.queryRows(doctype, { filters, fields, limit: 1 });
    if (!row) return undefined;
    return Array.isArray(fieldname) ? row : row[fieldname];
  }

  // ===========================================================================
  // setValue
  // ===========================================================================

  /**
   * Set a single field (as before) or several via a dict. Updates `modified`
   * (and `modified_by` when a session exists). No hooks or validation.
   */
  async setValue(
    doctype: string,
    name: string,
    fieldname: string | Row,
    value?: unknown,
  ): Promise<void> {
    const meta = this.registry.get(doctype); // validate doctype exists
    const tableName = toTableName(doctype);
    const now = new Date();
    const user = this.user();

    await this.assertDocAccess(meta, name, "write");

    const updates: Row =
      typeof fieldname === "string" ? { [fieldname]: value } : fieldname;
    const cols = Object.keys(updates);
    if (cols.length === 0) return;

    if (typeof fieldname === "string" && !user) {
      await this.q.execute(
        `UPDATE ${tableName} SET ${this.safeColumn(fieldname)} = $1, modified = $2 WHERE name = $3`,
        [value, now, name],
      );
      return;
    }

    const sets = cols.map((c, i) => `${ident(c)} = $${i + 1}`);
    const params: unknown[] = cols.map((c) => updates[c]);
    let n = cols.length;
    sets.push(`modified = $${++n}`);
    params.push(now);
    if (user) {
      sets.push(`modified_by = $${++n}`);
      params.push(user);
    }
    params.push(name);
    await this.q.execute(
      `UPDATE ${tableName} SET ${sets.join(", ")} WHERE name = $${n + 1}`,
      params,
    );
  }

  // ===========================================================================
  // exists
  // ===========================================================================

  async exists(
    doctype: string,
    nameOrFilters: string | Filters,
  ): Promise<boolean> {
    this.registry.get(doctype); // validate doctype exists

    if (typeof nameOrFilters === "string" && !this.options.enforcePermissions) {
      const tableName = toTableName(doctype);
      const row = await this.q.queryOne<{ name: string }>(
        `SELECT name FROM ${tableName} WHERE name = $1`,
        [nameOrFilters],
      );
      return row !== null;
    }

    const filters =
      typeof nameOrFilters === "string"
        ? { name: nameOrFilters }
        : nameOrFilters;
    const rows = await this.queryRows(doctype, {
      filters,
      fields: ["name"],
      limit: 1,
    });
    return rows.length > 0;
  }

  // ===========================================================================
  // Session + permissions
  // ===========================================================================

  private session(): SessionContext | undefined {
    return (this.options.getSession ?? getSession)();
  }

  private user(): string | undefined {
    return this.session()?.user;
  }

  /** Resolve what the current session may do. Throws PermissionError when denied. */
  private access(
    meta: DocTypeDefinition,
    ptype: PType,
  ): { bypass: boolean; ownerOnly: boolean; s?: SessionContext } {
    if (!this.options.enforcePermissions)
      return { bypass: true, ownerOnly: false };
    const s = this.session();
    if (!s)
      throw new PermissionError(`No session: cannot ${ptype} ${meta.name}`);
    if (s.user === "Administrator")
      return { bypass: true, ownerOnly: false, s };

    const rules = (
      (meta as { permissions?: PermRule[] }).permissions ?? []
    ).filter((r) => r[ptype] && s.roles.includes(r.role));
    if (rules.length === 0) {
      throw new PermissionError(
        `${s.user} has no ${ptype} permission on ${meta.name}`,
      );
    }
    return { bypass: false, ownerOnly: rules.every((r) => r.if_owner), s };
  }

  /** Per-document check: if_owner rules + user permissions on Link values. */
  private checkDocAccess(
    meta: DocTypeDefinition,
    ptype: PType,
    get: (k: string) => unknown,
  ): void {
    const a = this.access(meta, ptype);
    if (a.bypass) return;
    if (a.ownerOnly && get("owner") !== a.s!.user) {
      throw new PermissionError(
        `${a.s!.user} can only ${ptype} their own ${meta.name}`,
      );
    }
    this.checkUserPerms(meta, a.s, get);
  }

  private checkUserPerms(
    meta: DocTypeDefinition,
    s: SessionContext | undefined,
    get: (k: string) => unknown,
  ): void {
    if (!this.options.enforcePermissions || !s || s.user === "Administrator")
      return;
    const up = s.userPermissions;
    if (!up) return;

    const own = up[meta.name];
    const nm = get("name");
    if (own && nm !== undefined && nm !== "" && !own.includes(String(nm))) {
      throw new PermissionError(
        `${s.user} is not permitted to access ${meta.name} ${String(nm)}`,
      );
    }
    for (const f of meta.fields) {
      if (ftype(f) !== "Link") continue;
      const allowed = up[opts(f)];
      const v = get(f.fieldname);
      if (
        allowed &&
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !allowed.includes(String(v))
      ) {
        throw new PermissionError(
          `${s.user} is not permitted to use ${opts(f)} ${String(v)}`,
        );
      }
    }
  }

  /** SQL conditions that restrict list queries to what the session may read. */
  private permClauses(meta: DocTypeDefinition, ctx: Ctx): string[] {
    const a = this.access(meta, "read");
    if (a.bypass) return [];
    const s = a.s!;
    const out: string[] = [];
    if (a.ownerOnly) out.push(`t."owner" = ${ctx.p(s.user)}`);
    const up = s.userPermissions ?? {};
    const own = up[meta.name];
    if (own) out.push(`t."name" = ANY(${ctx.p(own)})`);
    for (const f of meta.fields) {
      if (ftype(f) !== "Link") continue;
      const allowed = up[opts(f)];
      if (!allowed) continue;
      const col = `t.${ident(f.fieldname)}`;
      out.push(`(${col} = ANY(${ctx.p(allowed)}) OR ${col} IS NULL)`);
    }
    return out;
  }

  private async assertDocAccess(
    meta: DocTypeDefinition,
    name: string,
    ptype: PType,
  ): Promise<void> {
    const a = this.access(meta, ptype);
    if (a.bypass) return;
    const row = await this.q.queryOne<Row>(
      `SELECT * FROM ${toTableName(meta.name)} WHERE name = $1`,
      [name],
    );
    if (!row) throw new NotFoundError(meta.name, name);
    this.checkDocAccess(meta, ptype, (k) => row[k]);
  }

  private docGetter(doc: Document): (k: string) => unknown {
    return (k) =>
      k === "owner" ? doc.owner : k === "name" ? doc.name : doc.get(k);
  }

  // ===========================================================================
  // Naming
  // ===========================================================================

  private autoname(meta: DocTypeDefinition): string | undefined {
    return (meta as { autoname?: string }).autoname || undefined;
  }

  /**
   * autoname values:
   *   "hash"                       random id
   *   "field:fieldname"            name = value of that field
   *   "prompt"                     caller must set doc.name
   *   "series:LOAN-.YYYY.-.####"   counter per prefix (LOAN-2026-0001)
   */
  private async nameFromAutoname(
    doc: Document,
    rule: string,
    now: Date,
  ): Promise<string> {
    if (rule === "hash") return generateHash(10);
    if (rule === "prompt") throw new Error(`${doc.doctype}: name is required`);
    if (rule.startsWith("field:")) {
      const v = doc.get(rule.slice(6));
      if (v === undefined || v === null || v === "") {
        throw new Error(
          `${doc.doctype}: ${rule.slice(6)} is required to name the document`,
        );
      }
      return String(v);
    }
    if (rule.startsWith("series:")) return this.nextSeries(rule.slice(7), now);
    throw new Error(`Unsupported autoname: ${rule}`);
  }

  private async nextSeries(pattern: string, now: Date): Promise<string> {
    const parts = pattern.split(".");
    const hashes = parts.pop();
    if (!hashes || !/^#+$/.test(hashes))
      throw new Error(`Invalid naming series: ${pattern}`);

    const y = String(now.getFullYear());
    const tokens: Record<string, string> = {
      YYYY: y,
      YY: y.slice(-2),
      MM: pad2(now.getMonth() + 1),
      DD: pad2(now.getDate()),
    };
    const prefix = parts.map((p) => tokens[p] ?? p).join("");

    this.seriesState.ready ??= this.db
      .execute(
        "CREATE TABLE IF NOT EXISTS nodra_series (name TEXT PRIMARY KEY, counter BIGINT NOT NULL DEFAULT 0)",
      )
      .then(() => undefined);
    await this.seriesState.ready;

    const rows = await this.q.query<{ counter: string }>(
      `INSERT INTO nodra_series (name, counter) VALUES ($1, 1)
       ON CONFLICT (name) DO UPDATE SET counter = nodra_series.counter + 1
       RETURNING counter`,
      [prefix],
    );
    return prefix + String(rows[0]!.counter).padStart(hashes.length, "0");
  }

  /**
   * Legacy naming (doctypes without `autoname`).
   */
  private generateName(meta: DocTypeDefinition): string {
    switch (meta.naming_rule) {
      case "hash":
        return generateHash(10);
      case "autoincrement":
        // Autoincrement is handled by the DB, but we need a placeholder.
        // In a real implementation this would use a sequence. Use hash as fallback.
        return generateHash(10);
      default:
        return generateHash(10);
    }
  }

  // ===========================================================================
  // Data builders (original)
  // ===========================================================================

  private buildInsertData(doc: Document, meta: DocTypeDefinition): Row {
    const data: Row = {
      name: doc.name,
      owner: doc.owner,
      creation: doc.creation,
      modified: doc.modified,
      modified_by: doc.modified_by,
      docstatus: doc.docstatus,
      idx: doc.idx,
    };

    // Add custom field values
    for (const field of meta.fields) {
      if (this.options.childTables && isTable(field)) continue; // stored in child tables
      const value = doc.get(field.fieldname);
      if (value !== undefined) {
        data[field.fieldname] = value;
      }
    }

    return data;
  }

  private buildUpdateData(doc: Document, meta: DocTypeDefinition): Row {
    const data: Row = {
      modified: doc.modified,
      modified_by: doc.modified_by,
    };

    // Include all custom fields that have values
    for (const field of meta.fields) {
      if (this.options.childTables && isTable(field)) continue; // stored in child tables
      const value = doc.get(field.fieldname);
      if (value !== undefined) {
        data[field.fieldname] = value;
      }
    }

    return data;
  }

  private rowToDocument(
    meta: DocTypeDefinition,
    row: Row,
    children: Row = {},
  ): Document {
    const doc = new Document(meta, { ...row, ...children, _isNew: false });
    doc.markAsClean();
    return doc;
  }

  private applyRowToDocument(doc: Document, row: Row): void {
    for (const [key, value] of Object.entries(row)) {
      doc.set(key, value);
    }
  }

  /** Reject anything that is not a plain column name (closes SQL injection in get/setValue). */
  private safeColumn(name: string): string {
    if (!IDENT.test(name)) throw new Error(`Invalid field name: ${name}`);
    return name; // unchanged from original: interpolated as-is
  }

  private async hook(doc: Document, name: string): Promise<void> {
    const fn = (doc as unknown as Record<string, unknown>)[name];
    if (typeof fn === "function") await (fn as () => Promise<void>).call(doc);
  }

  private isSubmittable(meta: DocTypeDefinition): boolean {
    return !!(meta as { is_submittable?: boolean | number }).is_submittable;
  }

  // ===========================================================================
  // Query compiler (advanced filters, joins, aggregates, permissions)
  // ===========================================================================

  private async queryRows(doctype: string, o: ListOptions): Promise<Row[]> {
    const meta = this.registry.get(doctype);
    const ctx = new Ctx();
    const aggAliases = new Set<string>();
    const numeric: string[] = [];

    const select = (o.fields?.length ? o.fields : ["*"])
      .map((f) => this.selectExpr(meta, f, ctx, aggAliases, numeric))
      .join(", ");
    const where = this.buildWhere(
      meta,
      o.filters,
      o.orFilters,
      ctx,
      this.permClauses(meta, ctx),
    );
    const group = o.groupBy
      ? ` GROUP BY ${o.groupBy
          .split(",")
          .map((s) => this.ref(meta, s.trim(), ctx))
          .join(", ")}`
      : "";
    const order = this.buildOrder(meta, o.orderBy, ctx, aggAliases);
    const joins = [...ctx.joins.values()].join(" ");

    let tail = "";
    if (o.limit !== undefined) tail += ` LIMIT ${this.int(o.limit)}`;
    if (o.offset !== undefined) tail += ` OFFSET ${this.int(o.offset)}`;

    const rows = await this.q.query<Row>(
      `SELECT ${o.distinct ? "DISTINCT " : ""}${select} FROM ${toTableName(doctype)} t ${joins}${where}${group}${order}${tail}`,
      ctx.params,
    );

    if (numeric.length) {
      for (const r of rows) {
        for (const k of numeric)
          if (r[k] !== null && r[k] !== undefined) r[k] = Number(r[k]);
      }
    }
    return rows;
  }

  /** "name" | "link.col" | "*" | "sum(amount) as total" | "count(*)" | "count(distinct member)" */
  private selectExpr(
    meta: DocTypeDefinition,
    f: string,
    ctx: Ctx,
    aggAliases: Set<string>,
    numeric: string[],
  ): string {
    if (f === "*") return "t.*";
    const m = AGG.exec(f.trim());
    if (!m) return `${this.ref(meta, f, ctx)} AS "${f}"`;

    const fn = m[1]!.toLowerCase();
    const distinct = m[2] ? "DISTINCT " : "";
    const arg = m[3]!;
    if (arg === "*" && (fn !== "count" || distinct))
      throw new Error(`Invalid aggregate: ${f}`);
    const inner = arg === "*" ? "*" : this.ref(meta, arg, ctx);
    const alias =
      m[4] ?? `${fn}_${arg === "*" ? "all" : arg.replace(/\./g, "_")}`;

    aggAliases.add(alias);
    if (fn === "count" || fn === "sum" || fn === "avg") numeric.push(alias); // pg returns these as strings
    return `${fn.toUpperCase()}(${distinct}${inner}) AS "${alias}"`;
  }

  private buildWhere(
    meta: DocTypeDefinition,
    filters: Filters | undefined,
    orFilters: Filters | undefined,
    ctx: Ctx,
    extra: string[] = [],
  ): string {
    const parts = normalize(filters).map((c) => this.compileCond(meta, c, ctx));
    const or = normalize(orFilters).map((c) => this.compileCond(meta, c, ctx));
    if (or.length) parts.push(`(${or.join(" OR ")})`);
    parts.push(...extra);
    return parts.length ? ` WHERE ${parts.join(" AND ")}` : "";
  }

  private buildOrder(
    meta: DocTypeDefinition,
    orderBy: string | undefined,
    ctx: Ctx,
    aggAliases: Set<string>,
  ): string {
    if (!orderBy) return "";
    const parts = orderBy
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [path, dir] = s.split(/\s+/) as [string, string?];
        const col = aggAliases.has(path)
          ? `"${path}"`
          : this.ref(meta, path, ctx);
        return `${col} ${dir?.toLowerCase() === "desc" ? "DESC" : "ASC"}`;
      });
    return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
  }

  private compileCond(meta: DocTypeDefinition, c: Cond, ctx: Ctx): string {
    let childField: Field | undefined;
    let column = c.field;

    if (c.doctype && c.doctype !== meta.name) {
      childField = meta.fields.find((f) => isTable(f) && opts(f) === c.doctype);
      if (!childField)
        throw new Error(`${c.doctype} is not a child table of ${meta.name}`);
    } else if (c.field.includes(".")) {
      const parts = c.field.split(".");
      const f = meta.fields.find((x) => x.fieldname === parts[0]);
      if (f && isTable(f)) {
        if (parts.length !== 2)
          throw new Error(
            `Child table filters support "table.column" only: ${c.field}`,
          );
        childField = f;
        column = parts[1]!;
      }
    }

    if (childField) {
      const child = this.registry.get(opts(childField));
      const inner = this.op(`c.${ident(column)}`, c.op, c.value, ctx);
      return (
        `EXISTS (SELECT 1 FROM ${toTableName(child.name)} c WHERE c.parent = t.name ` +
        `AND c.parentfield = ${ctx.p(childField.fieldname)} AND ${inner})`
      );
    }
    return this.op(this.ref(meta, c.field, ctx), c.op, c.value, ctx);
  }

  /**
   * Column reference. "link.column" or "link.link.link.column" adds one LEFT JOIN
   * per Link hop (e.g. "member.group.branch.branch_name" on Loan).
   */
  private ref(meta: DocTypeDefinition, path: string, ctx: Ctx): string {
    const parts = path.split(".");
    if (parts.length === 1) return `t.${ident(path)}`;

    let curMeta = meta;
    let curAlias = "t";
    const walked: string[] = [];
    for (const head of parts.slice(0, -1)) {
      const f = curMeta.fields.find((x) => x.fieldname === head);
      if (!f || ftype(f) !== "Link")
        throw new Error(`"${head}" is not a Link field of ${curMeta.name}`);
      const target = this.registry.get(opts(f));
      walked.push(head);
      const alias = `j_${walked.join("_")}`;
      if (!ctx.joins.has(alias)) {
        ctx.joins.set(
          alias,
          `LEFT JOIN ${toTableName(target.name)} ${alias} ON ${alias}.name = ${curAlias}.${ident(head)}`,
        );
      }
      curMeta = target;
      curAlias = alias;
    }
    return `${curAlias}.${ident(parts[parts.length - 1]!)}`;
  }

  private op(expr: string, op: Operator, v: unknown, ctx: Ctx): string {
    switch (op) {
      case "=":
        return v === null ? `${expr} IS NULL` : `${expr} = ${ctx.p(v)}`;
      case "!=":
        return v === null ? `${expr} IS NOT NULL` : `${expr} <> ${ctx.p(v)}`;
      case ">":
      case ">=":
      case "<":
      case "<=":
        return `${expr} ${op} ${ctx.p(v)}`;
      case "like":
        return `${expr} ILIKE ${ctx.p(v)}`;
      case "not like":
        return `${expr} NOT ILIKE ${ctx.p(v)}`;
      case "in":
      case "not in": {
        const arr = Array.isArray(v)
          ? v
          : String(v)
              .split(",")
              .map((s) => s.trim());
        if (arr.length === 0) return op === "in" ? "FALSE" : "TRUE";
        return op === "in"
          ? `${expr} = ANY(${ctx.p(arr)})`
          : `${expr} <> ALL(${ctx.p(arr)})`;
      }
      case "between": {
        if (!Array.isArray(v) || v.length !== 2)
          throw new Error("between needs [from, to]");
        return `${expr} BETWEEN ${ctx.p(v[0])} AND ${ctx.p(v[1])}`;
      }
      case "is":
        return String(v).toLowerCase() === "set"
          ? `(${expr} IS NOT NULL AND ${expr}::text <> '')`
          : `(${expr} IS NULL OR ${expr}::text = '')`;
      default:
        throw new Error(`Unsupported operator: ${op as string}`);
    }
  }

  private int(n: number): number {
    if (!Number.isInteger(n) || n < 0) throw new Error(`Invalid number: ${n}`);
    return n;
  }

  // ===========================================================================
  // Child tables, link validation, transactions (opt-in)
  // ===========================================================================

  private hasChildren(meta: DocTypeDefinition): boolean {
    return !!this.options.childTables && meta.fields.some(isTable);
  }

  private async loadChildren(
    db: Queryable,
    meta: DocTypeDefinition,
    name: string,
  ): Promise<Row> {
    const out: Row = {};
    for (const f of meta.fields.filter(isTable)) {
      out[f.fieldname] = await db.query<Row>(
        `SELECT * FROM ${toTableName(opts(f))} WHERE parent = $1 AND parenttype = $2 AND parentfield = $3 ORDER BY idx`,
        [name, meta.name, f.fieldname],
      );
    }
    return out;
  }

  /** Replace child rows for every Table field present on the document. */
  private async saveChildren(
    db: Queryable,
    doc: Document,
    meta: DocTypeDefinition,
    now: Date,
    only?: Set<string>,
  ): Promise<void> {
    for (const f of meta.fields.filter(isTable)) {
      if (only && !only.has(f.fieldname)) continue;
      const rows = doc.get(f.fieldname) as Row[] | undefined;
      if (rows === undefined) continue; // not loaded/touched: leave existing rows alone

      const child = this.registry.get(opts(f));
      const table = toTableName(child.name);
      await db.execute(
        `DELETE FROM ${table} WHERE parent = $1 AND parenttype = $2 AND parentfield = $3`,
        [doc.name, meta.name, f.fieldname],
      );

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]!;
        const data: Row = {
          name: (r["name"] as string) || generateHash(10),
          parent: doc.name,
          parenttype: meta.name,
          parentfield: f.fieldname,
          idx: i + 1,
          owner: doc.owner,
          creation: now,
          modified: now,
          modified_by: doc.modified_by,
          docstatus: 0,
        };
        for (const cf of child.fields) {
          if (hasColumn(cf) && r[cf.fieldname] !== undefined)
            data[cf.fieldname] = r[cf.fieldname];
        }
        const cols = Object.keys(data);
        await db.query(
          `INSERT INTO ${table} (${cols.map(ident).join(", ")}) VALUES (${cols.map((_, k) => `$${k + 1}`).join(", ")})`,
          cols.map((c) => data[c]),
        );
      }
    }
  }

  /** Link / Dynamic Link existence check, like Frappe's validate_links. */
  private async validateLinks(
    doc: Document,
    meta: DocTypeDefinition,
  ): Promise<void> {
    for (const f of meta.fields) {
      const value = doc.get(f.fieldname);
      if (value === undefined || value === null || value === "") continue;
      let target: string | undefined;
      if (ftype(f) === "Link") target = opts(f);
      else if (ftype(f) === "Dynamic Link")
        target = doc.get(opts(f)) as string | undefined;
      if (!target) continue;
      const row = await this.q.queryOne<{ name: string }>(
        `SELECT name FROM ${toTableName(target)} WHERE name = $1`,
        [String(value)],
      );
      if (row === null) {
        throw new Error(
          `Could not find ${f.fieldname}: ${target} ${String(value)}`,
        );
      }
    }
  }

  /**
   * Runs `fn` inside withTransaction (BEGIN/COMMIT/ROLLBACK on one pooled client)
   * when `transactional` is true; otherwise directly on the pool, exactly as before.
   */
  private async run<T>(
    transactional: boolean,
    fn: (db: Queryable) => Promise<T>,
  ): Promise<T> {
    if (this.inTx || !transactional) return fn(this.q); // already in (or no need for) a transaction
    return withTransaction(this.db, fn);
  }
}
