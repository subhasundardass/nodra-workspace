/**
 * Nodra Framework - Migration History
 *
 * Tracks which DocTypes have been synced to the database and a hash of
 * the definition that was applied. Re-runs of `nodra migrate` use this
 * to skip unchanged DocTypes, making migrations idempotent and fast.
 */

import type { Pool } from "pg";
import { createHash } from "node:crypto";
import type { DocTypeDefinition } from "../core/doctype/schema.js";

/**
 * Compute a stable hash of a DocType definition.
 *
 * JSON.stringify with sorted keys so semantically identical definitions
 * (e.g. differing only in key order) hash the same.
 */
export function hashDocTypeDefinition(doctype: DocTypeDefinition): string {
  const json = stableStringify(doctype);
  return createHash("sha256").update(json).digest("hex").slice(0, 16);
}

/**
 * Deterministic JSON stringify with recursively sorted object keys.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

const HISTORY_TABLE = "tab_migration_history";

/**
 * Migration history store backed by a PostgreSQL table.
 */
export class MigrationHistory {
  constructor(private pool: Pool) {}

  /**
   * Create the history table if it does not exist.
   */
  async ensureTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${HISTORY_TABLE} (
        name VARCHAR(255) PRIMARY KEY,
        definition_hash VARCHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  /**
   * Get the hash of the definition last applied for a DocType,
   * or undefined if the DocType has never been migrated.
   */
  async getAppliedHash(name: string): Promise<string | undefined> {
    const result = await this.pool.query<{ definition_hash: string }>(
      `SELECT definition_hash FROM ${HISTORY_TABLE} WHERE name = $1`,
      [name],
    );
    return result.rows[0]?.definition_hash;
  }

  /**
   * Record (or update) the applied hash for a DocType.
   */
  async record(name: string, definitionHash: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${HISTORY_TABLE} (name, definition_hash, applied_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (name) DO UPDATE SET definition_hash = $2, applied_at = NOW()`,
      [name, definitionHash],
    );
  }

  /**
   * Remove the history record for a DocType.
   */
  async clear(name: string): Promise<void> {
    await this.pool.query(`DELETE FROM ${HISTORY_TABLE} WHERE name = $1`, [
      name,
    ]);
  }
}
