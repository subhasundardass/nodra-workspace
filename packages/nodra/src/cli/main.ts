#!/usr/bin/env node

/**
 * Nodra's global CLI — `create` only.
 *
 * Everything else (migrate, console, new:doctype, new:server-fn) is
 * app-scoped and lives on each app's own CLI instead (see
 * templates/app/src/cli/main.ts.tpl and app-commands.ts) — they need
 * cwd = an existing app (doctypes/, src/server/functions/ resolve
 * relative to process.cwd()), which `create` runs before any app exists.
 */
import { Command } from 'commander';
import { registerCreateCommand } from './commands/create.js';

const program = new Command();

program.name('nodra').description('Nodra framework CLI').version('0.2.0');

registerCreateCommand(program);

await program.parseAsync(process.argv);
