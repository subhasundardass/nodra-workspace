/**
 * `new:doctype <Name>` — app-scoped. Scaffolds
 * `doctypes/<slug>/<slug>.json` + `doctypes/<slug>/<slug>.ts` in the
 * current working directory, matching the exact shape/conventions of
 * packages/nodra/doctypes/core/role/role.json (the framework's own
 * simplest built-in) — same required DocTypeDefinition fields, same
 * standard-fields-are-implicit convention, same controller pattern (a
 * `Document` subclass with commented-out lifecycle hook stubs, mirroring
 * doctypes/core/user/user.ts).
 */
import type { Command } from "commander";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

function toPascalCase(input: string): string {
  return input
    .trim()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toSlug(input: string): string {
  return input
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toClassName(input: string): string {
  return toPascalCase(input).replace(/\s+/g, "");
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function buildDoctypeJson(name: string, module: string): string {
  const json = {
    name,
    module,
    naming_rule: "hash",
    naming_field: "title",
    is_submittable: false,
    is_child: false,
    is_single: false,
    is_tree: false,
    is_virtual: false,
    title_field: "title",
    search_fields: ["title"],

    fields: [
      {
        fieldname: "title",
        fieldtype: "Data",
        label: "Title",
        reqd: true,
        unique: true,
        max_length: 140,
        in_list_view: true,
      },
      {
        fieldname: "workflow_state",
        fieldtype: "Select",
        label: "Workflow State",
        options: ["Draft", "Confirmed", "Cancelled"],
        default: "Draft",
        read_only: true,
        reqd: true,
        in_list_view: true,
        in_standard_filter: true,
      },
    ],

    workflow: {
      state_field: "workflow_state",
      states: [
        {
          state: "Draft",
          doc_status: 0,
          is_initial: true,
          color: "gray",
        },
        {
          state: "Confirmed",
          doc_status: 51,
          color: "green",
        },
        {
          state: "Cancelled",
          doc_status: 98,
          is_final: true,
          color: "red",
        },
      ],
      transitions: [
        {
          from: "Draft",
          action: "Confirm",
          to: "Confirmed",
          roles: ["System Manager", "Administrator"],
        },
        {
          from: "Draft",
          action: "Cancel",
          to: "Cancelled",
          roles: ["System Manager", "Administrator"],
        },
        {
          from: "Confirmed",
          action: "Cancel",
          to: "Cancelled",
          roles: ["System Manager", "Administrator"],
        },
      ],
    },

    permissions: [
      {
        role: "System Manager",
        read: true,
        write: true,
        create: true,
        delete: true,
        cancel: true,
      },
      {
        role: "Administrator",
        read: true,
        write: true,
        create: true,
        delete: true,
        cancel: true,
      },
      {
        role: "Operator",
        read: true,
        write: true,
        create: true,
        delete: false,
        cancel: false,
      },
    ],
  };

  return JSON.stringify(json, null, 2) + "\n";
}

function buildControllerTs(className: string): string {
  return `/**
 * ${className} DocType Controller
 *
 * Override the lifecycle hooks below for custom validation/behavior.
 * ORM operations (app.orm.insert/update/deleteDoc) call these automatically
 * — see the ORM's insert()/update() for the exact order they run in.
 */
import { Document } from 'nodra/core/document/document';

export class ${className} extends Document {
  title!: string;

  // async beforeValidate(): Promise<void> {
  //   // throw a ValidationError here to reject bad input before it's saved
  // }

  // async beforeInsert(): Promise<void> {}
  // async afterInsert(): Promise<void> {}
  // async beforeSave(): Promise<void> {}
  // async afterSave(): Promise<void> {}
}
`;
}

export function registerNewDoctypeCommand(program: Command): void {
  program
    .command("new:doctype <name>")
    .description(
      "Scaffold a new DocType (JSON definition + controller) in ./doctypes",
    )
    .option("--module <name>", "DocType module grouping", "App")
    .action(async (rawName: string, opts: { module: string }) => {
      const name = toPascalCase(rawName);
      const slug = toSlug(rawName);
      const className = toClassName(rawName);
      const dir = path.join(process.cwd(), "doctypes", slug);

      const jsonPath = path.join(dir, `${slug}.json`);
      const tsPath = path.join(dir, `${slug}.ts`);

      if ((await pathExists(jsonPath)) || (await pathExists(tsPath))) {
        console.error(
          `Error: ${dir} already has a "${slug}" doctype. Aborting.`,
        );
        process.exitCode = 1;
        return;
      }

      await mkdir(dir, { recursive: true });
      await writeFile(jsonPath, buildDoctypeJson(name, opts.module), "utf-8");
      await writeFile(tsPath, buildControllerTs(className), "utf-8");

      console.log(`Created doctypes/${slug}/${slug}.json`);
      console.log(`Created doctypes/${slug}/${slug}.ts`);
      console.log(`\nNext steps:`);
      console.log(
        `  1. Add real fields to ${slug}.json (see doctypes/README.md for conventions)`,
      );
      console.log(
        `  2. Restart the dev server — doctypes load once at boot (getNodra())`,
      );
      console.log(
        `  3. Run: npm run cli --workspace=<app> -- new:server-fn ${name} ` +
          `to scaffold matching server functions`,
      );
    });
}
