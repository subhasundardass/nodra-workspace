/**
 * CLI command types and interfaces
 */

/**
 * Base interface for CLI commands (the underlying business logic classes
 * migrate.ts/console.ts implement — wrapped by commander registrars in
 * cli/commands/ for real --help/option parsing).
 */
export interface Command {
  name: string;
  description: string;
  execute(args: string[]): Promise<void>;
}

/**
 * Migrate command options
 */
export interface MigrateOptions {
  dbUrl: string;
  siteName: string;
  verbose?: boolean;
  force?: boolean;
}

/**
 * Console (REPL) options
 */
export interface ConsoleOptions {
  dbUrl: string;
  siteName: string;
}
