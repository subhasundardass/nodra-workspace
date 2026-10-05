# Nodra Workspace

A two-package monorepo:

- **`packages/nodra`** — the framework: DocType metadata, Document,
  lifecycle hooks, generic CRUD, validation, permissions, ORM, naming,
  events, workflow, transactions. Pure TypeScript, no HTTP framework baked
  in.
- **`apps/<app-name>`** — a TanStack Start app that calls straight into
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
cp apps/<app-name>/.env.example apps/<app-name>/.env
# then edit apps/<app-name>/.env with real DB credentials
ppnpm install

```

```bash
# 3. Run it
ppnpm run dev
# → http://localhost:3000
```

## CLI

One truly global command, plus per-app commands that run against whichever
app you point them at.

```bash
# Global — the only thing that has to run before an app exists
pnpm run new:app -- <app-name>          # scaffolds apps/my-shop from scratch
pnpm --filter <app-name> install/add <package-name>

# App-scoped — default to <app-name> via the root shortcuts below
pnpm run new:doctype -- <DocType>         # doctypes/loan/{loan.json,loan.ts}
pnpm run new:server-fn -- <DocType>       # src/server/functions/loan.ts (needs the doctype first)
pnpm run migrate
pnpm run console

# Any other app, or the full command set: go through its own workspace
# pnpm run cli --workspace=my-shop -- new:doctype Invoice
# pnpm run cli --workspace=my-shop -- --help
```

### Other commands

```bash
pnpm run build             # production build (apps/<app-name>) → apps/<app-name>/.output
pnpm start                 # node apps/<app-name>/.output/server/index.mjs
pnpm run typecheck         # tsc --noEmit across both packages
```

## Architecture

```
packages/nodra                         apps/<app-name>
┌─────────────────────────┐            ┌──────────────────────────────┐
│ DocType metadata          │           │ TanStack Start                │
│ Document / lifecycle      │◄──────────┤  Server Functions              │
│ Generic CRUD, Validation  │  getNodra()│  (src/server/functions/*)     │
│ Permissions, ORM          │           │  Query Options (UI-side)      │
│ Naming, Hooks/Events      │           │  UI (React + TanStack Router) │
│ Workflow, Transactions    │           └──────────────────────────────┘
└─────────────────────────┘
```

## Admin Reset

pnpm --filter <app-name> cli admin-reset --username admin --password 'Admin@123'

## Test CURL

1.

curl -X POST http://localhost:3000/api/method/debug.doctypes -H "Content-Type: application/json" -d '{}'

2.

curl -i -c cookies.txt -X POST http://localhost:3000/api/method/auth.login -H "Content-Type: application/json" -d '{"email":"admin@localhost.com","password":"Admin@123"}'

3.

curl -i -b cookies.txt -X POST http://localhost:3000/api/method/auth.me -H "Content-Type: application/json" -d '{}'
