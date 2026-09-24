/**
 * migrate command - Sync DocTypes to database schema
 */

import type { Pool } from "pg";
import type { Command, MigrateOptions } from "./types.js";
import { loadDocTypesFromDirectory } from "../core/doctype/loader.js";
import { MetadataSync } from "../database/metadata-sync.js";

import { SchemaSync } from "../database/schema-sync.js";
import type { ColumnInfo } from "../database/schema-sync.js";
import { toTableName } from "../core/doctype/naming.js";
import { ensureMetadataTables } from "../database/metadata-schema.js";
import path from "node:path";
import {
  hashDocTypeDefinition,
  MigrationHistory,
} from "../database/migration-history.js";

/** * MigrateCommand synchronizes DocType definitions into: * *
 * 1. Nodra metadata tables * - tab_doc_type * - tab_doc_field * - tab_doc_perm * *
 * 2. Physical database tables * - tab_<doctype>
 * */
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
   *
   */
  private parseArgs(args: string[]): Pick<
    MigrateOptions,
    "verbose" | "force"
  > & {
    doctypeDir?: string;
  } {
    const options: Pick<MigrateOptions, "verbose" | "force"> & {
      doctypeDir?: string;
    } = {
      verbose: false,
      force: false,
    };

    for (const arg of args) {
      if (arg.startsWith("--doctype-dir=")) {
        options.doctypeDir = arg.slice("--doctype-dir=".length);
      } else if (arg === "--verbose") {
        options.verbose = true;
      } else if (arg === "--force") {
        options.force = true;
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

  /** * Execute the migrate command. * * Migration flow: * * 1. Find the DocType directory * 2. Load all DocTypes * 3. Ensure migration history table exists * 4. For each DocType: * a. Calculate definition hash * b. Skip unchanged DocTypes when force=false * c. Sync DocType metadata * d. Create or alter the physical database table * e. Ensure indexes exist * f. Record the applied definition hash * 5. Print migration summary */
  async execute(args: string[]): Promise<void> {
    // ============================================================
    // Step 1: Parse migration options
    // ============================================================
    const options = this.parseArgs(args);

    // ============================================================
    // Step 2: Resolve the application DocType directory
    // ============================================================
    const doctypeDir =
      options.doctypeDir ?? path.join(process.cwd(), "doctypes");

    if (options.verbose) {
      console.log(`Loading application DocTypes from: ${doctypeDir}`);
    }

    // ============================================================
    // Step 3: Load application DocTypes
    // ============================================================
    const appDocTypes = await loadDocTypesFromDirectory(doctypeDir);

    // ============================================================
    // Step 4: Load Nodra core DocTypes
    // ============================================================
    //
    // Core DocTypes are part of the Nodra framework itself.
    //
    // Examples:
    //   DocType
    //   DocField
    //   DocPerm
    //   User
    //   Role
    //   Workflow
    //   File
    //
    // They must also participate in migration because their JSON
    // definitions are the source of truth for the framework schema.
    // ============================================================

    const nodraRoot = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../..",
    );

    const coreDoctypeDir = path.join(nodraRoot, "doctypes", "core");

    if (options.verbose) {
      console.log(`Loading core DocTypes from: ${coreDoctypeDir}`);
    }

    const coreDocTypes = await loadDocTypesFromDirectory(coreDoctypeDir);

    // ============================================================
    // Step 5: Combine core + application DocTypes
    // ============================================================
    //
    // Core DocTypes are migrated first.
    // Application DocTypes are migrated afterwards.
    // ============================================================

    const doctypes = [...coreDocTypes, ...appDocTypes];

    console.log(`Found ${coreDocTypes.length} core DocTypes`);

    console.log(`Found ${appDocTypes.length} application DocTypes`);

    console.log(`Total DocTypes: ${doctypes.length}`);

    if (doctypes.length === 0) {
      console.log("No DocTypes found. Nothing to migrate.");
      return;
    }

    // ============================================================
    // Step 6: Prepare migration infrastructure
    // ============================================================
    //
    // Migration history is used to determine whether a DocType
    // definition has changed since the previous migration.
    // ============================================================

    await this.history.ensureTable();

    // ============================================================
    // Step 7: Bootstrap Nodra metadata tables
    // ============================================================
    //
    // MetadataSync itself writes to:
    //
    //   tab_doc_type
    //   tab_doc_field
    //   tab_doc_perm
    //
    // Therefore these three tables must exist before we attempt
    // to synchronize any DocType metadata.
    //
    // This is the bootstrap layer. After this point, the actual
    // DocType JSON definitions become the source of truth.
    // ============================================================

    await ensureMetadataTables(this.pool);

    // ============================================================
    // Step 8: Initialize migration counters
    // ============================================================

    let metadataCount = 0;
    let createCount = 0;
    let alterCount = 0;
    let indexCount = 0;
    let skippedCount = 0;

    // ============================================================
    // Step 9: Migrate each DocType
    // ============================================================

    for (const doctype of doctypes) {
      const tableName = toTableName(doctype.name);
      const definitionHash = hashDocTypeDefinition(doctype);

      if (options.verbose) {
        console.log(`\n----------------------------------------`);
        console.log(`Syncing DocType: ${doctype.name}`);
        console.log(`Table: ${tableName}`);
        console.log(`----------------------------------------`);
      }

      // ==========================================================
      // Step 9.1: Check migration history
      // ==========================================================
      //
      // If the DocType definition has not changed, migration can
      // normally be skipped.
      // ==========================================================

      if (!options.force) {
        const appliedHash = await this.history.getAppliedHash(doctype.name);

        if (appliedHash === definitionHash) {
          if (options.verbose) {
            console.log(`Skipping ${doctype.name} ` + `(definition unchanged)`);
          }

          skippedCount++;
          continue;
        }
      }

      // ==========================================================
      // Step 9.2: Synchronize DocType metadata
      // ==========================================================
      //
      // Metadata is stored in:
      //
      //   tab_doc_type
      //   tab_doc_field
      //   tab_doc_perm
      //
      // This keeps the database metadata representation synchronized
      // with the JSON DocType definition.
      // ==========================================================

      if (options.verbose) {
        console.log(`Synchronizing metadata: ${doctype.name}`);
      }

      await this.metadataSync.sync(doctype);

      metadataCount++;

      // ==========================================================
      // Step 9.3: Check whether the physical table exists
      // ==========================================================

      const exists = await this.tableExists(tableName);

      // ==========================================================
      // Step 9.4: Create physical table if it does not exist
      // ==========================================================

      if (!exists) {
        if (options.verbose) {
          console.log(`Creating table: ${tableName}`);
        }

        const createTableSql = this.schemaSync.generateCreateTable(doctype);

        await this.pool.query(createTableSql);

        createCount++;
      }

      // ==========================================================
      // Step 9.5: Synchronize existing physical table
      // ==========================================================
      else {
        if (options.verbose) {
          console.log(`Checking existing table: ${tableName}`);
        }

        const existingColumns = await this.getExistingColumns(tableName);

        const alterStatements = this.schemaSync.generateAlterTable(
          doctype,
          existingColumns,
        );

        // --------------------------------------------------------
        // Add missing columns
        // --------------------------------------------------------

        if (alterStatements.length > 0) {
          if (options.verbose) {
            console.log(
              `Adding ${alterStatements.length} column(s) ` + `to ${tableName}`,
            );
          }

          for (const alterSql of alterStatements) {
            await this.pool.query(alterSql);

            alterCount++;
          }
        }
      }

      // ==========================================================
      // Step 9.6: Ensure indexes exist
      // ==========================================================

      if (options.verbose) {
        console.log(`Checking indexes: ${tableName}`);
      }

      const indexSqls = this.schemaSync.generateIndexes(doctype);

      for (const indexSql of indexSqls) {
        await this.pool.query(indexSql);

        indexCount++;
      }

      // ==========================================================
      // Step 9.7: Record successful migration
      // ==========================================================
      //
      // IMPORTANT:
      //
      // The migration history is updated only after:
      //
      //   1. Metadata synchronization
      //   2. Table creation / alteration
      //   3. Index creation
      //
      // has completed successfully.
      //
      // If anything throws before this point, the DocType will not
      // be recorded as successfully migrated.
      // ==========================================================

      await this.history.record(doctype.name, definitionHash);

      if (options.verbose) {
        console.log(`Successfully migrated: ${doctype.name}`);
      }
    }

    // ============================================================
    // Step 10: Print migration summary
    // ============================================================

    console.log("\n========================================");
    console.log("Migration complete");
    console.log("========================================");

    console.log(`  DocTypes synchronized : ${metadataCount}`);

    console.log(`  Tables created        : ${createCount}`);

    console.log(`  Columns added         : ${alterCount}`);

    console.log(`  Indexes synchronized  : ${indexCount}`);

    console.log(`  Unchanged / skipped   : ${skippedCount}`);
  }
}
