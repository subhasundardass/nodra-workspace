#!/usr/bin/env node

/**
 * __APP_NAME__'s own CLI: framework-provided app-scoped commands
 * (migrate, console, new:doctype, new:server-fn) via registerAppCommands.
 *
 * Add bespoke commands specific to this app below — e.g.
 * `program.command('seed').action(...)`.
 */
import { Command } from 'commander';
import { registerAppCommands } from 'nodra/cli/app-commands.js';

const program = new Command();

program.name('__APP_NAME__').description("__APP_NAME__'s CLI").version('0.1.0');

registerAppCommands(program);

// Add __APP_NAME__-specific commands here, e.g.:
// program
//   .command('seed')
//   .description('Load sample data')
//   .action(async () => { ... });

await program.parseAsync(process.argv);
