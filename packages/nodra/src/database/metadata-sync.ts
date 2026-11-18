/**
 * Nodra Metadata Sync
 *
 * Synchronizes DocType definitions into Nodra's metadata tables:
 *
 *   tab_doc_type
 *   tab_doc_field
 *   tab_doc_perm
 *
 * Each DocType is synced inside a single transaction, so a failure
 * never leaves a half-synced DocType behind.
 */

import type { Pool, PoolClient } from "pg";
import type {
  DocTypeDefinition,
  FieldDefinition,
  PermissionRule,
} from "../core/doctype/schema";

/** Anything we can run a query on (a pooled client inside a transaction). */
type Queryable = Pick<PoolClient, "query">;

const OWNER = "Administrator";

export class MetadataSync {
  constructor(private readonly pool: Pool) {}

  /**
   * Create Nodra's metadata tables if they don't exist.
   * Must run before any sync() call.
   */
  async ensureTables(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tab_doc_type (
        name            TEXT PRIMARY KEY,
        owner           TEXT NOT NULL,
        creation        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified_by     TEXT NOT NULL,
        docstatus       INTEGER NOT NULL DEFAULT 0,
        idx             INTEGER NOT NULL DEFAULT 0,
        module          TEXT,
        naming_rule     TEXT,
        is_submittable  BOOLEAN NOT NULL DEFAULT false,
        is_child        BOOLEAN NOT NULL DEFAULT false,
        is_single       BOOLEAN NOT NULL DEFAULT false,
        is_tree         BOOLEAN NOT NULL DEFAULT false,
        is_virtual      BOOLEAN NOT NULL DEFAULT false,
        title_field     TEXT,
        sort_field      TEXT,
        sort_order      TEXT
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tab_doc_field (
        name                TEXT PRIMARY KEY,
        owner               TEXT NOT NULL,
        creation            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified_by         TEXT NOT NULL,
        docstatus           INTEGER NOT NULL DEFAULT 0,
        idx                 INTEGER NOT NULL DEFAULT 0,
        parent              TEXT NOT NULL,
        parenttype          TEXT NOT NULL,
        parentfield         TEXT NOT NULL,
        fieldname           TEXT NOT NULL,
        fieldtype           TEXT NOT NULL,
        label               TEXT,
        options             TEXT,
        reqd                BOOLEAN NOT NULL DEFAULT false,
        "unique"            BOOLEAN NOT NULL DEFAULT false,
        "default"           TEXT,
        max_length          INTEGER,
        precision           INTEGER,
        hidden              BOOLEAN NOT NULL DEFAULT false,
        read_only           BOOLEAN NOT NULL DEFAULT false,
        in_list_view        BOOLEAN NOT NULL DEFAULT false,
        in_standard_filter  BOOLEAN NOT NULL DEFAULT false,
        search_index        BOOLEAN NOT NULL DEFAULT false,
        description         TEXT,
        depends_on          TEXT
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS tab_doc_perm (
        name         TEXT PRIMARY KEY,
        owner        TEXT NOT NULL,
        creation     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        modified_by  TEXT NOT NULL,
        docstatus    INTEGER NOT NULL DEFAULT 0,
        idx          INTEGER NOT NULL DEFAULT 0,
        parent       TEXT NOT NULL,
        parenttype   TEXT NOT NULL,
        parentfield  TEXT NOT NULL,
        role         TEXT NOT NULL,
        "read"       BOOLEAN NOT NULL DEFAULT false,
        "write"      BOOLEAN NOT NULL DEFAULT false,
        "create"     BOOLEAN NOT NULL DEFAULT false,
        "delete"     BOOLEAN NOT NULL DEFAULT false,
        "submit"     BOOLEAN NOT NULL DEFAULT false,
        "cancel"     BOOLEAN NOT NULL DEFAULT false,
        "amend"      BOOLEAN NOT NULL DEFAULT false,
        "if_owner"   BOOLEAN NOT NULL DEFAULT false
      )
    `);

    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS idx_tab_doc_field_parent ON tab_doc_field (parent)`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS idx_tab_doc_perm_parent ON tab_doc_perm (parent)`,
    );
  }

  /**
   * Sync one DocType definition into metadata tables.
   *
   * Runs in a single transaction: either the DocType, its fields and
   * its permissions are all written, or nothing is.
   */
  async sync(doctype: DocTypeDefinition): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      await this.syncDocType(client, doctype);
      await this.syncFields(client, doctype);
      await this.syncPermissions(client, doctype);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // ---------------------------------------------------------------------------
  // Naming helpers (single source of truth for row names, used by upsert + prune)
  // ---------------------------------------------------------------------------

  private fieldRowName(doctype: DocTypeDefinition, fieldname: string): string {
    return `${doctype.name}-${fieldname}`;
  }

  private permRowName(doctype: DocTypeDefinition, role: string): string {
    return `${doctype.name}-perm-${role}`;
  }

  // ---------------------------------------------------------------------------
  // DocType
  // ---------------------------------------------------------------------------

  /**
   * Sync the parent DocType metadata.
   */
  private async syncDocType(
    db: Queryable,
    doctype: DocTypeDefinition,
  ): Promise<void> {
    await db.query(
      `
      INSERT INTO tab_doc_type (
        name,
        owner,
        creation,
        modified,
        modified_by,
        docstatus,
        idx,
        module,
        naming_rule,
        is_submittable,
        is_child,
        is_single,
        is_tree,
        is_virtual,
        title_field,
        sort_field,
        sort_order
      )
      VALUES (
        $1,
        $2,
        NOW(),
        NOW(),
        $2,
        0,
        0,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
      )
      ON CONFLICT (name)
      DO UPDATE SET
        modified = NOW(),
        modified_by = EXCLUDED.modified_by,
        module = EXCLUDED.module,
        naming_rule = EXCLUDED.naming_rule,
        is_submittable = EXCLUDED.is_submittable,
        is_child = EXCLUDED.is_child,
        is_single = EXCLUDED.is_single,
        is_tree = EXCLUDED.is_tree,
        is_virtual = EXCLUDED.is_virtual,
        title_field = EXCLUDED.title_field,
        sort_field = EXCLUDED.sort_field,
        sort_order = EXCLUDED.sort_order
      `,
      [
        doctype.name, // $1
        OWNER, // $2
        doctype.module ?? null, // $3
        doctype.naming_rule ?? null, // $4
        doctype.is_submittable ?? false, // $5
        doctype.is_child ?? false, // $6
        doctype.is_single ?? false, // $7
        doctype.is_tree ?? false, // $8
        doctype.is_virtual ?? false, // $9
        doctype.title_field ?? null, // $10
        doctype.sort_field ?? null, // $11
        doctype.sort_order ?? null, // $12
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Fields
  // ---------------------------------------------------------------------------

  /**
   * Sync all fields belonging to the DocType, then remove rows for
   * fields that no longer exist in the definition.
   */
  private async syncFields(
    db: Queryable,
    doctype: DocTypeDefinition,
  ): Promise<void> {
    for (let idx = 0; idx < doctype.fields.length; idx++) {
      const field = doctype.fields[idx];
      if (!field) {
        continue;
      }
      await this.syncField(db, doctype, field, idx + 1);
    }

    await this.pruneFields(db, doctype);
  }

  /**
   * Sync one DocField.
   *
   * Nodra currently stores fields using the parent DocType name.
   */
  private async syncField(
    db: Queryable,
    doctype: DocTypeDefinition,
    field: FieldDefinition,
    idx: number,
  ): Promise<void> {
    await db.query(
      `
      INSERT INTO tab_doc_field (
        name,
        owner,
        creation,
        modified,
        modified_by,
        docstatus,
        idx,
        parent,
        parenttype,
        parentfield,
        fieldname,
        fieldtype,
        label,
        options,
        reqd,
        "unique",
        "default",
        max_length,
        precision,
        hidden,
        read_only,
        in_list_view,
        in_standard_filter,
        search_index,
        description,
        depends_on
      )
      VALUES (
        $1,
        $2,
        NOW(),
        NOW(),
        $2,
        0,
        $3,
        $4,
        'DocType',
        'fields',
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20
      )
      ON CONFLICT (name)
      DO UPDATE SET
        modified = NOW(),
        modified_by = EXCLUDED.modified_by,
        idx = EXCLUDED.idx,
        parent = EXCLUDED.parent,
        parenttype = EXCLUDED.parenttype,
        parentfield = EXCLUDED.parentfield,
        fieldname = EXCLUDED.fieldname,
        fieldtype = EXCLUDED.fieldtype,
        label = EXCLUDED.label,
        options = EXCLUDED.options,
        reqd = EXCLUDED.reqd,
        "unique" = EXCLUDED."unique",
        "default" = EXCLUDED."default",
        max_length = EXCLUDED.max_length,
        precision = EXCLUDED.precision,
        hidden = EXCLUDED.hidden,
        read_only = EXCLUDED.read_only,
        in_list_view = EXCLUDED.in_list_view,
        in_standard_filter = EXCLUDED.in_standard_filter,
        search_index = EXCLUDED.search_index,
        description = EXCLUDED.description,
        depends_on = EXCLUDED.depends_on
      `,
      [
        this.fieldRowName(doctype, field.fieldname), // $1
        OWNER, // $2
        idx, // $3
        doctype.name, // $4
        field.fieldname, // $5
        field.fieldtype, // $6
        field.label ?? null, // $7
        this.serializeOptions(field.options), // $8
        field.reqd ?? false, // $9
        field.unique ?? false, // $10
        field.default != null ? String(field.default) : null, // $11
        field.max_length ?? null, // $12
        field.precision ?? null, // $13
        field.hidden ?? false, // $14
        field.read_only ?? false, // $15
        field.in_list_view ?? false, // $16
        field.in_standard_filter ?? false, // $17
        field.search_index ?? false, // $18
        field.description ?? null, // $19
        field.depends_on ?? null, // $20
      ],
    );
  }

  /**
   * Delete metadata rows for fields removed from the DocType definition.
   * Only touches tab_doc_field; physical columns are never dropped.
   */
  private async pruneFields(
    db: Queryable,
    doctype: DocTypeDefinition,
  ): Promise<void> {
    await db.query(
      `
      DELETE FROM tab_doc_field
      WHERE parent = $1
        AND NOT (name = ANY($2::text[]))
      `,
      [
        doctype.name,
        doctype.fields.map((f) => this.fieldRowName(doctype, f.fieldname)),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  /**
   * Sync DocType permissions, then remove rows for rules that no
   * longer exist in the definition.
   */
  private async syncPermissions(
    db: Queryable,
    doctype: DocTypeDefinition,
  ): Promise<void> {
    for (let idx = 0; idx < doctype.permissions.length; idx++) {
      const permission = doctype.permissions[idx];
      if (!permission) {
        continue;
      }
      await this.syncPermission(db, doctype, permission, idx + 1);
    }

    await this.prunePermissions(db, doctype);
  }

  private async syncPermission(
    db: Queryable,
    doctype: DocTypeDefinition,
    permission: PermissionRule,
    idx: number,
  ): Promise<void> {
    await db.query(
      `
      INSERT INTO tab_doc_perm (
        name,
        owner,
        creation,
        modified,
        modified_by,
        docstatus,
        idx,
        parent,
        parenttype,
        parentfield,
        role,
        "read",
        "write",
        "create",
        "delete",
        "submit",
        "cancel",
        "amend",
        "if_owner"
      )
      VALUES (
        $1,
        $2,
        NOW(),
        NOW(),
        $2,
        0,
        $3,
        $4,
        'DocType',
        'permissions',
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
      )
      ON CONFLICT (name)
      DO UPDATE SET
        modified = NOW(),
        modified_by = EXCLUDED.modified_by,
        idx = EXCLUDED.idx,
        parent = EXCLUDED.parent,
        parenttype = EXCLUDED.parenttype,
        parentfield = EXCLUDED.parentfield,
        role = EXCLUDED.role,
        "read" = EXCLUDED."read",
        "write" = EXCLUDED."write",
        "create" = EXCLUDED."create",
        "delete" = EXCLUDED."delete",
        "submit" = EXCLUDED."submit",
        "cancel" = EXCLUDED."cancel",
        "amend" = EXCLUDED."amend",
        "if_owner" = EXCLUDED."if_owner"
      `,
      [
        this.permRowName(doctype, permission.role), // $1
        OWNER, // $2
        idx, // $3
        doctype.name, // $4
        permission.role, // $5
        permission.read ?? false, // $6
        permission.write ?? false, // $7
        permission.create ?? false, // $8
        permission.delete ?? false, // $9
        permission.submit ?? false, // $10
        permission.cancel ?? false, // $11
        permission.amend ?? false, // $12
        permission.if_owner ?? false, // $13
      ],
    );
  }

  /**
   * Delete metadata rows for permission rules removed from the DocType
   * definition.
   */
  private async prunePermissions(
    db: Queryable,
    doctype: DocTypeDefinition,
  ): Promise<void> {
    await db.query(
      `
      DELETE FROM tab_doc_perm
      WHERE parent = $1
        AND NOT (name = ANY($2::text[]))
      `,
      [
        doctype.name,
        doctype.permissions.map((p) => this.permRowName(doctype, p.role)),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private serializeOptions(
    options: string | string[] | undefined,
  ): string | null {
    if (options === undefined) {
      return null;
    }

    if (Array.isArray(options)) {
      return options.join("\n");
    }

    return options;
  }
}
