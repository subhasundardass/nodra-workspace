import { Command } from "commander";
import { Pool } from "pg";
import { registerAppCommands } from "nodra/cli/app-commands.js";
import { seedRoles } from "./seed-roles.js";
import { seedStates } from "./seed-states.js";

const program = new Command();

program.name("myshop").description("myshop's CLI").version("0.1.0");

registerAppCommands(program);

function createPool() {
  return new Pool({
    host: process.env.NODRA_DB_HOST ?? "localhost",
    port: Number(process.env.NODRA_DB_PORT ?? 5432),
    database: process.env.NODRA_DB_DATABASE ?? "nodra",
    user: process.env.NODRA_DB_USER ?? "postgres",
    password: process.env.NODRA_DB_PASSWORD ?? "",
    min: Number(process.env.NODRA_DB_POOL_MIN ?? 2),
    max: Number(process.env.NODRA_DB_POOL_MAX ?? 10),
  });
}

async function runSeed(label: string, seed: (pool: Pool) => Promise<void>) {
  const pool = createPool();

  try {
    await seed(pool);
  } catch (error) {
    console.error(`Failed to seed ${label}:`, error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

program
  .command("seed:roles")
  .description(
    "Create built-in system roles and assign System Manager to admin",
  )
  .action(() => runSeed("roles", seedRoles));

program
  .command("seed:states")
  .description("Create Indian states and union territories")
  .action(() => runSeed("states", seedStates));

await program.parseAsync(process.argv);
