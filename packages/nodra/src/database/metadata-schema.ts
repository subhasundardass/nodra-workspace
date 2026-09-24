import type { Pool } from "pg";

export async function ensureMetadataTables(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tab_doc_type (
      name TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      modified_by TEXT NOT NULL,
      docstatus INTEGER NOT NULL DEFAULT 0,
      idx INTEGER NOT NULL DEFAULT 0,

      module TEXT,
      naming_rule TEXT,
      is_submittable BOOLEAN NOT NULL DEFAULT FALSE,
      is_child BOOLEAN NOT NULL DEFAULT FALSE,
      is_single BOOLEAN NOT NULL DEFAULT FALSE,
      is_tree BOOLEAN NOT NULL DEFAULT FALSE,
      is_virtual BOOLEAN NOT NULL DEFAULT FALSE,

      title_field TEXT,
      sort_field TEXT,
      sort_order TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tab_doc_field (
      name TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      modified_by TEXT NOT NULL,
      docstatus INTEGER NOT NULL DEFAULT 0,
      idx INTEGER NOT NULL DEFAULT 0,

      parent TEXT NOT NULL,
      parenttype TEXT NOT NULL,
      parentfield TEXT NOT NULL,

      fieldname TEXT NOT NULL,
      fieldtype TEXT NOT NULL,
      label TEXT,
      options TEXT,

      reqd BOOLEAN NOT NULL DEFAULT FALSE,
      "unique" BOOLEAN NOT NULL DEFAULT FALSE,
      "default" TEXT,

      max_length INTEGER,
      precision INTEGER,

      hidden BOOLEAN NOT NULL DEFAULT FALSE,
      read_only BOOLEAN NOT NULL DEFAULT FALSE,
      in_list_view BOOLEAN NOT NULL DEFAULT FALSE,
      in_standard_filter BOOLEAN NOT NULL DEFAULT FALSE,
      search_index BOOLEAN NOT NULL DEFAULT FALSE,

      description TEXT,
      depends_on TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tab_doc_perm (
      name TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      modified_by TEXT NOT NULL,
      docstatus INTEGER NOT NULL DEFAULT 0,
      idx INTEGER NOT NULL DEFAULT 0,

      parent TEXT NOT NULL,
      parenttype TEXT NOT NULL,
      parentfield TEXT NOT NULL,

      role TEXT NOT NULL,

      "read" BOOLEAN NOT NULL DEFAULT FALSE,
      "write" BOOLEAN NOT NULL DEFAULT FALSE,
      "create" BOOLEAN NOT NULL DEFAULT FALSE,
      "delete" BOOLEAN NOT NULL DEFAULT FALSE,
      "submit" BOOLEAN NOT NULL DEFAULT FALSE,
      "cancel" BOOLEAN NOT NULL DEFAULT FALSE,
      "amend" BOOLEAN NOT NULL DEFAULT FALSE,
      if_owner BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tab_doc_field_parent
    ON tab_doc_field(parent)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tab_doc_perm_parent
    ON tab_doc_perm(parent)
  `);
}
