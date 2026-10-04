/**
 * CLI entry point - Command routing and execution
 *
 * NOTE: this module (and main.ts, which it side-effect-imports) is the
 * *global* CLI — `create` only. App-scoped commands (migrate, console,
 * new:doctype, new:server-fn) are exported individually below for apps to
 * compose into their own CLI via app-commands.ts, not run from here.
 */

export * from './types';
export { MigrateCommand } from './migrate';
export { ConsoleCommand } from './console';
export { registerAppCommands } from './app-commands';

import './main.js'; // runs main() as a side effect
