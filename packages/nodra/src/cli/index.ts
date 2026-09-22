/**
 * CLI entry point - Command routing and execution
 *
 * NOTE: this module (and main.ts, which it side-effect-imports) is the
 * *global* CLI — `create` only. App-scoped commands (migrate, console,
 * new:doctype, new:server-fn) are exported individually below for apps to
 * compose into their own CLI via app-commands.ts, not run from here.
 */

export * from './types.js';
export { MigrateCommand } from './migrate.js';
export { ConsoleCommand } from './console.js';
export { registerAppCommands } from './app-commands.js';

import './main.js'; // runs main() as a side effect
