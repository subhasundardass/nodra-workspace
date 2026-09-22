/**
 * `create <name>` — the one truly global command.
 *
 * Everything else — migrate, console, new:doctype, new:server-fn —
 * is app-scoped and lives on each app's own CLI because those commands
 * need the cwd of an existing app.
 *
 * This command runs from the framework's CLI:
 *
 *   pnpm --filter nodra cli create <name>
 *
 * It copies templates/app/ into apps/<name> at the detected workspace root.
 */

import type { Command } from "commander";
import {
  readdir,
  mkdir,
  readFile,
  writeFile,
  stat,
  access,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
  "app",
);

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Walk up from cwd looking for the pnpm workspace root.
 *
 * The command may execute with cwd inside:
 *
 *   packages/nodra
 *
 * so we cannot assume cwd is the repository root.
 *
 * A pnpm workspace is identified by pnpm-workspace.yaml.
 */
async function findWorkspaceRoot(startDir: string): Promise<string> {
  let dir = startDir;

  for (let i = 0; i < 10; i++) {
    const workspaceFile = path.join(dir, "pnpm-workspace.yaml");

    if (await pathExists(workspaceFile)) {
      return dir;
    }

    const parent = path.dirname(dir);

    if (parent === dir) {
      break;
    }

    dir = parent;
  }

  throw new Error(
    "Could not find the pnpm workspace root " +
      `(pnpm-workspace.yaml) walking up from ${startDir}. ` +
      "Run this command from inside the Nodra workspace.",
  );
}

async function copyTemplateDir(
  src: string,
  dest: string,
  appName: string,
): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);

    if (entry.isDirectory()) {
      await copyTemplateDir(srcPath, path.join(dest, entry.name), appName);
      continue;
    }

    const isTpl = entry.name.endsWith(".tpl");

    const destName = isTpl ? entry.name.slice(0, -".tpl".length) : entry.name;

    const destPath = path.join(dest, destName);

    if (isTpl) {
      const content = await readFile(srcPath, "utf-8");

      await writeFile(
        destPath,
        content.replaceAll("__APP_NAME__", appName),
        "utf-8",
      );
    } else {
      const content = await readFile(srcPath, "utf-8");

      await writeFile(destPath, content, "utf-8");
    }
  }
}

export function registerCreateCommand(program: Command): void {
  program
    .command("create <name>")
    .description(
      "Scaffold a new app (TanStack Start + Nodra) under apps/<name>",
    )
    .action(async (rawName: string) => {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(rawName)) {
        console.error(
          `Error: invalid app name "${rawName}". ` +
            "Use lowercase letters, numbers, and hyphens.",
        );

        process.exitCode = 1;
        return;
      }

      const templateStat = await stat(TEMPLATE_DIR).catch(() => null);

      if (!templateStat?.isDirectory()) {
        console.error(
          `Error: template directory not found at ${TEMPLATE_DIR}.`,
        );

        process.exitCode = 1;
        return;
      }

      const workspaceRoot = await findWorkspaceRoot(process.cwd());

      const appsDir = path.join(workspaceRoot, "apps");
      const destDir = path.join(appsDir, rawName);

      if (await pathExists(destDir)) {
        console.error(`Error: ${destDir} already exists. Aborting.`);

        process.exitCode = 1;
        return;
      }

      await mkdir(appsDir, { recursive: true });

      await copyTemplateDir(TEMPLATE_DIR, destDir, rawName);

      console.log(`\nCreated apps/${rawName}\n`);

      console.log("Next steps:");
      console.log(`  cd ${workspaceRoot}`);
      console.log(`  pnpm install`);
      console.log(`  cp apps/${rawName}/.env.example apps/${rawName}/.env`);
      console.log(`  # edit apps/${rawName}/.env with real DB credentials`);
      console.log(`  pnpm --filter ${rawName} dev\n`);
    });
}
