/**
 * migrate command - Sync DocTypes to database schema
 */

import type { Pool } from "pg";
import type { Command, MigrateOptions } from "./types";
import { loadDocTypesFromDirectory } from "../core/doctype/loader";
import type { DocTypeDefinition } from "../core/doctype/schema";
import { MetadataSync } from "../database/metadata-sync";
import { SchemaSync } from "../database/schema-sync";
import type { ColumnInfo } from "../database/schema-sync";
import { toTableName } from "../core/doctype/naming";
import path from "node:path";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  hashDocTypeDefinition,
  MigrationHistory,
} from "../database/migration-history";

/**
 * MigrateCommand synchronizes DocType definitions into:
 *
 * 1. Nodra metadata tables
 *    - tab_doc_type
 *    - tab_doc_field
 *    - tab_doc_perm
 *
 * 2. Physical database tables
 *    - tab_<doctype>
 *
 * Core (system) DocTypes such as User and Role are synced first,
 * followed by the app's own DocTypes.
 */
export class MigrateCommand implements Command {
  name = "migrate";
  description = "Sync DocType definitions to database schema";

  private readonly schemaSync: SchemaSync;
  private readonly metadataSync: MetadataSync;
  private readonly history: MigrationHistory;

  constructor(private readonly pool: Pool) {
    this.schemaSync = new SchemaSync();
    this.metadataSync = new MetadataSync(pool);
    this.history = new MigrationHistory(pool);
  }

  /**
   * Parse migrate-specific command arguments.
   */
  private parseArgs(args: string[]): {
    verbose: boolean;
    doctypeDir?: string;
  } {
    const options: { verbose: boolean; doctypeDir?: string } = {
      verbose: false,
    };

    for (const arg of args) {
      if (arg.startsWith("--doctype-dir=")) {
        options.doctypeDir = arg.slice("--doctype-dir=".length);
      } else if (arg === "--verbose") {
        options.verbose = true;
      }
    }

    return options;
  }

  /**
   * Get existing columns for a database table.
   */
  private async getExistingColumns(tableName: string): Promise<ColumnInfo[]> {
    const result = await this.pool.query<ColumnInfo>(
      `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
      ORDER BY ordinal_position
      `,
      [tableName],
    );

    return result.rows;
  }

  /**
   * Check whether a table exists in the current database schema.
   */
  private async tableExists(tableName: string): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name = $1
      ) AS exists
      `,
      [tableName],
    );

    return result.rows[0]?.exists === true;
  }

  /**
   * Check whether a directory exists.
   */
  private async dirExists(dir: string): Promise<boolean> {
    try {
      await access(dir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load core (system) DocTypes shipped with the framework.
   * Returns an empty list if the directory does not exist yet.
   */
  private async loadCoreDocTypes(
    verbose: boolean,
  ): Promise<DocTypeDefinition[]> {
    // ESM-safe replacement for __dirname.
    const coreDir = fileURLToPath(
      new URL("../../doctypes/core", import.meta.url),
    );

    if (!(await this.dirExists(coreDir))) {
      console.warn(`Core DocType directory not found, skipping: ${coreDir}`);
      return [];
    }

    if (verbose) {
      console.log(`Loading core DocTypes from: ${coreDir}`);
    }

    return loadDocTypesFromDirectory(coreDir);
  }

  /**
   * Merge core and app DocTypes (core first) and reject duplicate names.
   */
  private mergeDocTypes(
    core: DocTypeDefinition[],
    app: DocTypeDefinition[],
  ): DocTypeDefinition[] {
    const seen = new Set<string>();

    for (const doctype of [...core, ...app]) {
      if (seen.has(doctype.name)) {
        throw new Error(
          `Duplicate DocType name "${doctype.name}". ` +
            `App DocTypes cannot reuse the name of a core DocType.`,
        );
      }
      seen.add(doctype.name);
    }

    return [...core, ...app];
  }

  /**
   * Execute the migrate command.
   *
   * Migration flow:
   *
   * 1. Parse options
   * 2. Bootstrap tables the migrator itself needs
   *    (metadata tables + migration history)
   * 3. Load core DocTypes, then app DocTypes
   * 4. For each DocType:
   *    a. Calculate definition hash
   *    b. Skip unchanged DocTypes when force=false
   *    c. Sync DocType metadata
   *    d. Create or alter the physical database table
   *    e. Ensure indexes exist
   *    f. Record the applied definition hash
   * 5. Print migration summary
   */
  async execute(args: string[]): Promise<void> {
    // ------------------------------------------------------------
    // Step 1: Parse command options
    // ------------------------------------------------------------
    const options = this.parseArgs(args);

    const doctypeDir =
      options.doctypeDir ?? path.join(process.cwd(), "doctypes");

    // ------------------------------------------------------------
    // Step 2: Bootstrap tables required by the migrator itself
    // ------------------------------------------------------------
    // These cannot be DocTypes: the migrator needs them before it
    // can sync any DocType.
    await this.metadataSync.ensureTables();
    await this.history.ensureTable();

    // ------------------------------------------------------------
    // Step 3: Load DocTypes (core first, then app)
    // ------------------------------------------------------------
    if (options.verbose) {
      console.log(`Loading app DocTypes from: ${doctypeDir}`);
    }

    const coreDoctypes = await this.loadCoreDocTypes(options.verbose);
    const appDoctypes = await loadDocTypesFromDirectory(doctypeDir);
    const doctypes = this.mergeDocTypes(coreDoctypes, appDoctypes);

    console.log(
      `Found ${doctypes.length} DocTypes ` +
        `(${coreDoctypes.length} core, ${appDoctypes.length} app)`,
    );

    if (doctypes.length === 0) {
      console.log("No DocTypes found. Nothing to migrate.");
      return;
    }

    // ------------------------------------------------------------
    // Step 4: Migration configuration
    // ------------------------------------------------------------
    // Temporarily force migration while the migration system
    // is being developed.
    //
    // Later this should come from a real CLI flag:
    //
    //   const force = hasFlag(args, "force");
    //
    const force = true;

    // ------------------------------------------------------------
    // Step 5: Migration counters
    // ------------------------------------------------------------
    let metadataCount = 0;
    let createCount = 0;
    let alterCount = 0;
    let indexCount = 0;
    let skippedCount = 0;

    // ------------------------------------------------------------
    // Step 6: Synchronize each DocType
    // ------------------------------------------------------------
    for (const doctype of doctypes) {
      const tableName = toTableName(doctype.name);
      const definitionHash = hashDocTypeDefinition(doctype);

      if (options.verbose) {
        console.log(`\nSyncing DocType: ${doctype.name}`);
      }

      // Step 6.1: Check migration history
      if (!force) {
        const appliedHash = await this.history.getAppliedHash(doctype.name);

        if (appliedHash === definitionHash) {
          if (options.verbose) {
            console.log(
              `Skipping ${tableName} (unchanged since last migration)`,
            );
          }

          skippedCount++;
          continue;
        }
      }

      // Step 6.2: Sync DocType metadata
      if (options.verbose) {
        console.log(`Syncing metadata: ${doctype.name}`);
      }

      await this.metadataSync.sync(doctype);
      metadataCount++;

      // Step 6.3–6.6: Sync the physical table and indexes.
      // Virtual DocTypes only need metadata; they have no physical table.
      if (doctype.is_virtual) {
        if (options.verbose) {
          console.log(
            `Skipping physical table for virtual DocType: ${doctype.name}`,
          );
        }
      } else {
        // Step 6.3: Check whether the physical table exists
        const exists = await this.tableExists(tableName);

        if (!exists) {
          // Step 6.4: Create a new physical table
          if (options.verbose) {
            console.log(`Creating table: ${tableName}`);
          }

          const createTableSql = this.schemaSync.generateCreateTable(doctype);

          if (createTableSql) {
            await this.pool.query(createTableSql);
            createCount++;
          }
        } else {
          // Step 6.5: Alter an existing physical table
          if (options.verbose) {
            console.log(`Checking table: ${tableName}`);
          }

          const existingColumns = await this.getExistingColumns(tableName);
          const alterStatements = this.schemaSync.generateAlterTable(
            doctype,
            existingColumns,
          );

          if (alterStatements.length > 0 && options.verbose) {
            console.log(
              `Altering table: ${tableName} (${alterStatements.length} columns)`,
            );
          }

          for (const alterSql of alterStatements) {
            await this.pool.query(alterSql);
            alterCount++;
          }
        }

        // Step 6.6: Ensure indexes exist
        for (const indexSql of this.schemaSync.generateIndexes(doctype)) {
          await this.pool.query(indexSql);
          indexCount++;
        }
      }

      // Step 6.7: Record successful migration.
      // Virtual DocTypes also need migration history.
      await this.history.record(doctype.name, definitionHash);
    }

    // ------------------------------------------------------------
    // Step 7: Print migration summary
    // ------------------------------------------------------------
    console.log("\nMigration complete:");
    console.log(`  - DocTypes synced: ${metadataCount}`);
    console.log(`  - Tables created: ${createCount}`);
    console.log(`  - Columns added: ${alterCount}`);
    console.log(`  - Indexes created: ${indexCount}`);
    console.log(`  - Unchanged (skipped): ${skippedCount}`);
  }
}
