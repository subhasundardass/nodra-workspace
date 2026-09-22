/**
 * migrate command - Sync DocTypes to database schema
 */

import type { Pool } from "pg";
import type { Command, MigrateOptions } from "./types.js";
import { NodraError } from "../core/errors.js";
import { loadDocTypesFromDirectory } from "../core/doctype/loader.js";
import { MetadataSync } from "../database/metadata-sync.js";
import { SchemaSync } from "../database/schema-sync.js";
import type { ColumnInfo } from "../database/schema-sync.js";
import { toTableName } from "../core/doctype/naming.js";
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
  private history: MigrationHistory;

  constructor(private readonly pool: Pool) {
    this.schemaSync = new SchemaSync();
    this.metadataSync = new MetadataSync(pool);
    this.history = new MigrationHistory(pool);
  }

  /**
   * Parse migrate-specific command arguments.
   *
   */
  private parseArgs(args: string[]): Pick<MigrateOptions, "verbose"> & {
    doctypeDir?: string;
  } {
    const options: Pick<MigrateOptions, "verbose"> & {
      doctypeDir?: string;
    } = {
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

  /** * Execute the migrate command. * * Migration flow: * * 1. Find the DocType directory * 2. Load all DocTypes * 3. Ensure migration history table exists * 4. For each DocType: * a. Calculate definition hash * b. Skip unchanged DocTypes when force=false * c. Sync DocType metadata * d. Create or alter the physical database table * e. Ensure indexes exist * f. Record the applied definition hash * 5. Print migration summary */
  async execute(args: string[]): Promise<void> {
    // ------------------------------------------------------------
    // Step 1: Parse command options
    // ------------------------------------------------------------
    const options = this.parseArgs(args);

    // ------------------------------------------------------------
    // Step 2: Determine the DocType directory
    // ------------------------------------------------------------
    const doctypeDir =
      options.doctypeDir ?? path.join(process.cwd(), "doctypes");

    if (options.verbose) {
      console.log(`Loading DocTypes from: ${doctypeDir}`);
    }

    // ------------------------------------------------------------
    // Step 3: Load all DocTypes from source files
    // ------------------------------------------------------------
    const doctypes = await loadDocTypesFromDirectory(doctypeDir);

    console.log(`Found ${doctypes.length} DocTypes`);

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

    // Migration history stores the hash of the last
    // successfully synchronized DocType definition.
    await this.history.ensureTable();

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

      // ----------------------------------------------------------
      // Step 6.1: Check migration history
      // ----------------------------------------------------------
      if (!force) {
        const appliedHash = await this.history.getAppliedHash(doctype.name);

        if (appliedHash === definitionHash) {
          if (options.verbose) {
            console.log(
              `Skipping ${tableName} ` + `(unchanged since last migration)`,
            );
          }

          skippedCount++;
          continue;
        }
      }

      // ----------------------------------------------------------
      // Step 6.2: Sync DocType metadata
      // ----------------------------------------------------------
      //
      // This synchronizes the definition into Nodra's
      // metadata tables:
      //
      //   tab_doc_type
      //   tab_doc_field
      //   tab_doc_perm
      //
      // The metadata is the framework's representation
      // of the DocType definition.
      // ----------------------------------------------------------
      if (options.verbose) {
        console.log(`Syncing metadata: ${doctype.name}`);
      }

      await this.metadataSync.sync(doctype);
      metadataCount++;

      // ----------------------------------------------------------
      // Step 6.3: Check whether the physical table exists
      // ----------------------------------------------------------
      const exists = await this.tableExists(tableName);

      // ----------------------------------------------------------
      // Step 6.4: Create a new physical table
      // ----------------------------------------------------------
      if (!exists) {
        if (options.verbose) {
          console.log(`Creating table: ${tableName}`);
        }

        const createTableSql = this.schemaSync.generateCreateTable(doctype);

        await this.pool.query(createTableSql);
        createCount++;
      }

      // ----------------------------------------------------------
      // Step 6.5: Alter an existing physical table
      // ----------------------------------------------------------
      else {
        if (options.verbose) {
          console.log(`Checking table: ${tableName}`);
        }

        const existingColumns = await this.getExistingColumns(tableName);

        const alterStatements = this.schemaSync.generateAlterTable(
          doctype,
          existingColumns,
        );

        if (alterStatements.length > 0) {
          if (options.verbose) {
            console.log(
              `Altering table: ${tableName} ` +
                `(${alterStatements.length} columns)`,
            );
          }

          for (const alterSql of alterStatements) {
            await this.pool.query(alterSql);
            alterCount++;
          }
        }
      }

      // ----------------------------------------------------------
      // Step 6.6: Ensure indexes exist
      // ----------------------------------------------------------
      const indexSqls = this.schemaSync.generateIndexes(doctype);

      for (const indexSql of indexSqls) {
        await this.pool.query(indexSql);
        indexCount++;
      }

      // ----------------------------------------------------------
      // Step 6.7: Record successful migration
      // ----------------------------------------------------------
      //
      // This must happen AFTER metadata, table, and indexes
      // have been synchronized successfully.
      //
      // If any previous operation throws an error, this line
      // is never reached and the DocType is not marked as
      // successfully migrated.
      // ----------------------------------------------------------
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
