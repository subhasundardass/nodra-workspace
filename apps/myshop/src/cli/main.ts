// #!/usr/bin/env node

import { Command } from "commander";
import { Pool } from "pg";
import { registerAppCommands } from "nodra/cli/app-commands.js";
import { seedRoles } from "./seed-roles.js";

const program = new Command();

program.name("myshop").description("myshop's CLI").version("0.1.0");

registerAppCommands(program);

program
  .command("seed:roles")
  .description(
    "Create built-in system roles and assign System Manager to admin",
  )
  .action(async () => {
    const pool = new Pool({
      host: process.env.NODRA_DB_HOST ?? "localhost",
      port: Number(process.env.NODRA_DB_PORT ?? 5432),
      database: process.env.NODRA_DB_DATABASE ?? "nodra",
      user: process.env.NODRA_DB_USER ?? "postgres",
      password: process.env.NODRA_DB_PASSWORD ?? "",
      min: Number(process.env.NODRA_DB_POOL_MIN ?? 2),
      max: Number(process.env.NODRA_DB_POOL_MAX ?? 10),
    });

    try {
      await seedRoles(pool);
    } catch (error) {
      console.error("Failed to seed roles:", error);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });

await program.parseAsync(process.argv);
