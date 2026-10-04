/**
 * App-scoped commands — meant to be composed into each app's own CLI
 * entry point (see the `src/cli/main.ts` template under templates/app),
 * not the framework's global CLI. All four need to run with cwd = the app
 * root (doctypes/, src/server/functions/ are resolved relative to
 * process.cwd()), which is what happens naturally when invoked via
 * `npm run cli --workspace=<app> -- <command>`.
 */
import type { Command } from 'commander';
import { registerMigrateCommand } from './commands/migrate';
import { registerConsoleCommand } from './commands/console';
import { registerNewDoctypeCommand } from './commands/new-doctype';
import { registerNewServerFnCommand } from './commands/new-server-fn';

export function registerAppCommands(program: Command): void {
  registerMigrateCommand(program);
  registerConsoleCommand(program);
  registerNewDoctypeCommand(program);
  registerNewServerFnCommand(program);
}
