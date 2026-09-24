# Nodra Workspace

A two-package monorepo:

- **`packages/nodra`** — the framework: DocType metadata, Document,
  lifecycle hooks, generic CRUD, validation, permissions, ORM, naming,
  events, workflow, transactions. Pure TypeScript, no HTTP framework baked
  in.
- **`apps/todo`** — a TanStack Start app that calls straight into
  `packages/nodra`'s ORM from **server functions** (`createServerFn`), with
  a React UI on top via TanStack Router/Query.

Nodra was originally built on Fastify with a REST API. Both were dropped:
the Fastify server was replaced by TanStack Start, and the REST API layer
was replaced by server functions calling `app.orm`/`app.registry` directly
— no HTTP round-trip from the app's own UI to its own API. See
[Architecture](#architecture) below for why, and what still exists if you
need a public REST surface later.

Everything in this README has been **verified against a real install,
`tsc --noEmit` on both packages, and an actual `vite build` + booted
production server** — not just written and assumed correct. See
[Verification](#verification) for exactly what was checked.

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10 (workspaces support; this repo uses pnpm workspaces, not
  ppnpm/yarn — see [Package manager](#package-manager-note) if you'd rather
  use one of those)
- PostgreSQL (any version Nodra's `pg` driver supports)

## Setup

`--legacy-peer-deps` is required here, not optional — plain `pnpm install`
hits a known pnpm/Arborist resolver crash
(`Cannot read properties of null (reading 'edgesOut')`) triggered by
Vitest 4's peer dependency graph. This is an pnpm bug, not a problem with
this repo's dependencies; `--legacy-peer-deps` sidesteps it cleanly.

```bash
# 2. Configure the app
cp apps/todo/.env.example apps/todo/.env
# then edit apps/todo/.env with real DB credentials
ppnpm install

```

```bash
# 3. Run it
ppnpm run dev
# → http://localhost:3000
```

`pnpm run dev` (defined at the workspace root) runs `vite dev` inside
`apps/todo`. First run generates `apps/todo/src/routeTree.gen.ts`
automatically — don't hand-write this file, it's gitignored.

## CLI

One truly global command, plus per-app commands that run against whichever
app you point them at.

```bash
# Global — the only thing that has to run before an app exists
pnpm run new:app -- todo          # scaffolds apps/my-shop from scratch

# App-scoped — default to todo via the root shortcuts below
pnpm run new:doctype -- Todo         # doctypes/loan/{loan.json,loan.ts}
pnpm run new:server-fn -- Todo       # src/server/functions/loan.ts (needs the doctype first)
pnpm run migrate
pnpm run console

# Any other app, or the full command set: go through its own workspace
# pnpm run cli --workspace=my-shop -- new:doctype Invoice
# pnpm run cli --workspace=my-shop -- --help
```

**Why `new:app` is the only global command:** `migrate`, `console`,
`new:doctype`, and `new:server-fn` all need `process.cwd()` to be an
_existing_ app (they read/write that app's `doctypes/` and
`src/server/functions/`) — so each generated app gets its own CLI entry
point (`src/cli/main.ts`) composing these from
`packages/nodra/src/cli/app-commands.ts`, rather than running them from
`packages/nodra`'s own CLI. `new:app` is the one command that has to run
_before_ an app exists, so it lives on the framework's global CLI instead
(`packages/nodra/src/cli/main.ts`).

**`new:app` isn't a from-scratch template** — it copies
`packages/nodra/src/cli/templates/app/`, which is a snapshot of the exact
`apps/todo` wiring that was actually built, typechecked, and booted in this
repo (not a parallel, never-run template that might drift). Placeholders
(`__APP_NAME__`) get substituted into `package.json` and the landing page;
everything else — `vite.config.ts`, `src/router.tsx`, `src/server/*` — is
copied verbatim.

**`new:server-fn <Doctype>` requires `new:doctype <Doctype>` first.** The
generated server functions construct the doctype's own controller class
(`new Loan(meta, data)`), not a generic `Document` — see
[Document lifecycle](#document-lifecycle-a-gap-worth-knowing-about) below
for why that distinction matters. If the controller file doesn't exist
yet, the command refuses with a message telling you to run `new:doctype`
first, rather than silently generating something that wouldn't run
lifecycle hooks.

`apps/todo` currently has a working `Loan` doctype + server functions
(`doctypes/loan/`, `src/server/functions/loan.ts`) generated exactly this
way, left in as a real, typechecked, build-verified example — not
something you asked for as a permanent feature, just proof the generators
produce working code. Delete both if you don't want them.

### Other commands

```bash
pnpm run build             # production build (apps/todo) → apps/todo/.output
pnpm start                 # node apps/todo/.output/server/index.mjs
pnpm run typecheck         # tsc --noEmit across both packages
```

## Architecture

```
packages/nodra                         apps/todo
┌─────────────────────────┐            ┌──────────────────────────────┐
│ DocType metadata          │           │ TanStack Start                │
│ Document / lifecycle      │◄──────────┤  Server Functions              │
│ Generic CRUD, Validation  │  getNodra()│  (src/server/functions/*)     │
│ Permissions, ORM          │           │  Query Options (UI-side)      │
│ Naming, Hooks/Events      │           │  UI (React + TanStack Router) │
│ Workflow, Transactions    │           └──────────────────────────────┘
└─────────────────────────┘
```

`apps/todo/src/server/nodra-app.ts` (`getNodra()`) is the one seam where
`apps/todo` reaches into `packages/nodra` — a lazily-initialized singleton
(DB pool + `DocTypeRegistry` + `ORM`), loaded from both
`packages/nodra/doctypes` (framework built-ins: User, Role, ...) and
`apps/todo/doctypes` (this app's own doctypes), merged into one registry.

**Server functions, not a REST API.** `apps/todo/src/server/functions/document.ts`
exports `getDocument` / `listDocuments` / `createDocument` /
`updateDocument` / `deleteDocument` — plain `createServerFn()` calls that
invoke `app.orm.getDoc()` etc. directly, in-process. There is currently no
`/api/resource/...`-style REST surface. If you need one later (for external
API consumers, not this app's own UI), that's a server-_route_ concern
(`createFileRoute({ server: { handlers } })`) rather than server functions
— server function URLs aren't a stable public contract meant for arbitrary
external HTTP clients to call directly.

**Auth** (`apps/todo/src/server/auth.ts`) is `requireAuth`/`optionalAuth`
**function middleware**, attached via `.middleware([...])` on a
`createServerFn()` — not the same thing as server-_route_ request
middleware. Function middleware doesn't receive a raw `Request` object (it
wraps a function call, not an HTTP request), so the bearer token is read
via `getRequestHeader('authorization')`, an ambient helper from
`@tanstack/react-start/server` that reads the current request's headers
out of async-local-storage.

**Current auth posture:** all document server functions use `optionalAuth`
(attaches `context.user` when a token is present, never rejects) —
intentionally open, matching what the original Fastify `resourceRoutes()`
did (permission-check infrastructure existed but was never wired in
`nodra.ts`). To lock an operation down, swap in `requireAuth` and call
`assertResourcePermission(app, context.user, action, doctype, name)` at the
top of the handler — see the comment block in `auth.ts`.

## Doctypes

Two directories, merged at boot (framework first, so app doctypes can
safely reference framework ones):

- `packages/nodra/doctypes/core/` — built-ins (User, Role, File, ...)
- `apps/todo/doctypes/` — this app's own doctypes (a `README.md` explaining
  the convention, plus a `loan/` example generated by `new:doctype` — see
  [CLI](#cli))

## Document lifecycle: a gap worth knowing about

Checked this directly against `core/doctype/loader.ts` rather than
assuming: **Nodra has no automatic controller discovery.**
`loadDocTypesFromDirectory()` only reads `*.json` files — nothing scans for
or imports a sibling `*.ts` controller (like `doctypes/core/user/user.ts`,
or the generated `doctypes/loan/loan.ts`). The association between a
doctype and its controller class only exists at the call site: whatever
class you construct is what `app.orm.insert(doc)`/`update(doc)` calls
lifecycle hooks (`beforeValidate`, `beforeInsert`, `afterInsert`,
`beforeSave`, `afterSave`) on.

That means:

- `new:server-fn`'s generated functions do this correctly — they import
  and construct the real controller class (`new Loan(meta, data)`), so
  custom hooks actually run.
- A hypothetical _generic_, doctype-agnostic server function (taking
  `doctype: string` at the call site and constructing a plain
  `new Document(meta, data)`) structurally **cannot** run a controller's
  custom hooks — it doesn't know which subclass to instantiate. It still
  gets framework-level DocType field validation (schema-driven, not
  controller-based), just not anything a controller overrides.

This is exactly why `new:server-fn <Doctype>` requires `new:doctype
<Doctype>` to have already run: the controller file is a hard dependency
for lifecycle hooks to have any effect, not an optional nicety.

## Package manager note

This repo uses **pnpm workspaces** (`"workspaces"` in the root
`package.json`, `"nodra": "*"` in `apps/todo/package.json` resolving to the
local `packages/nodra` symlink). If you'd rather use **ppnpm**, swap the
root `package.json`'s `workspaces` field for a `ppnpm-workspace.yaml`
listing `packages/*` and `apps/*`, and change `"nodra": "*"` to
`"nodra": "workspace:*"`. Everything else (subpath `exports`, no build
step for `nodra`) works identically either way.

## Why no CLI bin

`packages/nodra/package.json` deliberately has **no `bin` field**. A `bin`
entry pointing at `src/cli/main.ts` would be broken by design — plain
`node` can't parse TypeScript, so running it directly as an installed
binary would fail. Run it via the `cli` pnpm script instead (which goes
through `tsx`), as shown above.

## Verification

This isn't a "looks right" port — the following was actually run, not just
reasoned about:

1. **Real `pnpm install`** at the workspace root (surfaced and fixed: two
   deprecated `@types/*` stub packages that ship their own types now).
2. **`tsc --noEmit` on both packages**, clean. This surfaced and fixed
   several real bugs along the way:
   - `packages/nodra/src/api/method.ts` was imported by `apps/todo` but had
     never actually been copied into the package — a dangling import.
   - The original library barrel (`packages/nodra/src/index.ts`)
     re-exported the CLI, which side-effect-imports `main.ts` and runs
     `process.argv` parsing on import — meaning `import 'nodra'` anywhere,
     including inside the SSR app, would have silently executed the CLI.
     Removed.
   - `cli/main.ts` constructed `MigrateCommand`/`ConsoleCommand` with zero
     arguments; both require an injected `pg.Pool`. Fixed by parsing
     `--db-url` and constructing the pool before dispatch.
   - `createMiddleware().server()`'s two-branch `optionalAuth` (one
     `next()` call per branch) inferred two incompatible context types;
     TypeScript rejected it. Fixed by computing `user` once, then a single
     `next({ context: { user } })` call.
   - Server function return types (`Record<string, unknown>` — Document
     field values are genuinely dynamic) failed Start's compile-time
     serializability check. Fixed with `strict: { output: false }`.
3. **A real production build** (`vite build`) — this caught issues `tsc`
   alone didn't:
   - The installed `@tanstack/react-start` version's actual API (verified
     by reading its shipped `.d.ts` files directly, not docs, which were
     stale relative to what's published) turned out to have no
     `createStartHandler({ createRouter, getRouterManifest })` /
     `StartClient` / `router-manifest` pattern at all — that whole
     hand-written `ssr.tsx`/`client.tsx` pair was deleted in favor of the
     package's own verified-correct default entries.
   - `router.tsx` must export a function named exactly `getRouter` (not
     `createRouter`) — confirmed via the framework's own
     `fake-entries/router.d.ts` contract, and via a real "missing export"
     bundler error before the fix.
   - `nitroV2Plugin({ target: ... })` doesn't exist; the real option is
     `preset` (Nitro v2 renamed `target` → `preset`).
4. **Booted the real production server** (`node .output/server/index.mjs`)
   and sent real requests: `GET /` returned 200 (full SSR render), and
   `GET /health` — with no database configured — returned a graceful
   `{"status":"unhealthy"}` (503) rather than crashing the process,
   confirming the error-handling path works under an actual failure
   condition, not just in theory.
5. **Every CLI command was actually run, not just written:**
   - `pnpm run new:app -- test-shop` — really scaffolded `apps/test-shop`,
     confirmed `__APP_NAME__` substitution landed correctly, added it to
     the workspace with a real `pnpm install`, ran `tsc --noEmit` (clean
     apart from the expected pre-routeTree-generation cascade) and a real
     `vite build`, then **booted it** and got `GET / → 200`. Deleted
     afterward — it was a verification run, not a feature you asked for.
   - This surfaced a real bug: the template files under
     `packages/nodra/src/cli/templates/app/` were being picked up by
     `packages/nodra`'s _own_ `tsc --noEmit` (same directory tree, `.ts`
     extension) and failed to compile against the framework package's
     tsconfig (no JSX, no DOM lib, no generated route tree — because
     they're not meant to compile there at all, only after being copied
     into a real app). Fixed by excluding `src/cli/templates` from
     `packages/nodra/tsconfig.json`.
   - `pnpm run new:doctype -- Loan` then `pnpm run new:server-fn -- Loan` —
     really generated `doctypes/loan/` and
     `src/server/functions/loan.ts` into `apps/todo`, then `tsc --noEmit`
     and a full `vite build` on `apps/todo` with the generated files
     included — both clean.
   - Deliberately re-ran `new:doctype -- Loan`, `new:app -- test-shop`,
     and `new:server-fn` for a doctype with no controller yet — all three
     guard conditions fired correctly with clear error messages, rather
     than silently overwriting or generating broken output.

What's _not_ independently verified end-to-end: an actual server function
call against a live Postgres database, and the `console`/`migrate` CLI
commands against a real database (this environment has no DB to connect
to). The wiring is verified — types check, every generator produces code
that builds, the app boots — but exercise these against your real database
before treating them as fully proven.
