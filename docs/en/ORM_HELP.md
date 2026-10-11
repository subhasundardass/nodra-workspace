# Nodra ORM: reference for AI assistants

Read this before writing or changing any code that touches the database, doctypes, sessions or permissions in Nodra. It describes how the code behaves, not how it is meant to behave.

## 1. Architecture

- **Runtime:** TanStack Start (Vite + Nitro) is the HTTP server. API routes live in `src/routes/api/**`.
- **Bootstrap:** `getNodra()` in `nodra-app.ts` returns a process-wide singleton `NodraApp` with `db`, `registry`, `orm`, `resource` (ResourceAPI), `methods`, `logger`.
- **ORM file:** `packages/nodra/src/orm/crud.ts`, imported as `nodra/orm/crud.js`. Class `ORM`.
- **Database:** PostgreSQL only. The ORM uses `$1` placeholders, `ILIKE`, and `= ANY($n)`.
- **Doctypes:** metadata (fields, permissions, naming) loaded into `DocTypeRegistry`. Table name = `toTableName(doctype)`.
- **Documents:** `Document` instances carry lifecycle hooks. The ORM never mutates SQL results into plain objects unless you call `getAll`.

## 2. Hard rules

1. Never build SQL by string concatenation with user input. Use the ORM. Identifiers are validated, values are parameterized.
2. Never call `db.query` directly for doctype data when `orm` can do it. Direct SQL skips permissions, hooks and validation.
3. `getList` returns `Document[]`. `getAll` returns plain rows. Use `getAll` for joins, aggregates and reports.
4. Do not wrap normal request handlers in `asSystem` / `runAsAdministrator`. It bypasses all permissions.
5. Never pass `owner` or `modified_by` yourself. The ORM sets them from the session.
6. Do not hand-edit `docstatus`. Use `orm.submit` and `orm.cancel`.
7. Table names that are SQL reserved words (`Group`, `Order`, `User`) break unless `toTableName` returns a safe name such as `tab_group`.

## 3. Constructor and options

```ts
new ORM(db, registry, options?: ORMOptions)
```

| Option               | Default                       | Effect                                                    |
| -------------------- | ----------------------------- | --------------------------------------------------------- |
| `staleCheck`         | false (app sets true via env) | Reject save if row changed since load                     |
| `enforcePermissions` | false                         | Enforce doctype `permissions` + session `userPermissions` |
| `childTables`        | false                         | Persist Table fields in child tables                      |
| `validateLinks`      | false                         | Verify Link / Dynamic Link targets exist on save          |
| `getSession`         | AsyncLocalStorage             | Override session source                                   |

App-level env vars (read in `nodra-app.ts`): `NODRA_STALE_CHECK` (default on), `NODRA_ENFORCE_PERMISSIONS`, `NODRA_CHILD_TABLES`, `NODRA_VALIDATE_LINKS` (default off). Values: `1`/`true`/`yes` = on.

**Backward compatibility:** with no options and a plain call, the ORM runs the original `QueryBuilder` code path. The new SQL compiler is used only when a call uses advanced features (section 5) or when `enforcePermissions` is on.

## 4. Methods

| Method                                                   | Returns                   | Notes                                                                 |
| -------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `insert(doc)`                                            | `Document`                | Names, validates, saves. Lifecycle below                              |
| `getDoc(doctype, name)`                                  | `Document`                | Throws `NotFoundError`. Loads children if `childTables`               |
| `getList(doctype, options?)`                             | `Document[]`              | No default limit                                                      |
| `getAll(doctype, options?)`                              | `Row[]`                   | Always uses the compiler. Supports aggregates                         |
| `update(doc)`                                            | `Document`                | Updating a missing row is a silent no-op                              |
| `submit(doc)` / `cancel(doc)`                            | `Document`                | Needs `is_submittable`                                                |
| `deleteDoc(doctype, name)`                               | `void`                    | Blocked for submitted docs                                            |
| `getCount(doctype, filters?, orFilters?)` / `count(...)` | `number`                  | `count` is an alias                                                   |
| `getValue(doctype, nameOrFilters, field \| fields[])`    | value / row / `undefined` |                                                                       |
| `setValue(doctype, name, field \| dict, value?)`         | `void`                    | No hooks, no validation. Sets `modified` (+ `modified_by` if session) |
| `exists(doctype, nameOrFilters)`                         | `boolean`                 |                                                                       |

**Insert lifecycle:** create-permission check, naming (legacy hash up front), set owner/timestamps, `beforeValidate`, `validate`, `validateDocument`, optional `validateLinks`, user-permission check, naming (if `autoname`), `beforeInsert`, `beforeSave`, SQL INSERT (+ children), `afterSave`, `afterInsert`.

**Update lifecycle:** write-permission check, `beforeValidate`, `validate`, `validateDocument`, optional `validateLinks`, `beforeSave`, lock row and stale/docstatus checks, SQL UPDATE (+ children), `afterSave`, `onChange`.

## 5. Filters, fields, ordering

### Filter formats

```ts
{
  status: "Open";
} // equals (legacy, still valid)
{
  amount: [">", 50000];
} // operator form
{
  status: ["in", ["Active", "Overdue"]];
}
{
  disbursed_on: ["between", ["2026-01-01", "2026-12-31"]];
}
{
  email: ["is", "set"];
} // or "not set"
[
  ["status", "=", "Open"],
  ["amount", ">", 100],
] // tuple list (AND)
[["Sales Invoice Item", "item_code", "=", "X"]]; // child-table tuple (4 items)
```

`orFilters` takes the same formats and is combined with `AND (a OR b OR ...)`.

**Operators:** `=`, `!=`, `>`, `>=`, `<`, `<=`, `like` (case-insensitive), `not like`, `in`, `not in`, `between`, `is`. A `null` value with `=` / `!=` becomes `IS NULL` / `IS NOT NULL`. Empty `in` matches nothing.

A plain-object value is treated as an operator only if it is a 2-item array whose first item is an operator string.

### Link paths (joins)

Dot paths follow Link fields, one LEFT JOIN per hop, any depth. Each segment is a **fieldname**, not a doctype name.

```ts
// Loan.member -> Member.group -> Group.branch -> Branch.branch_name
{ "member.group.branch.branch_name": "Siliguri" }
```

Works in `filters`, `orFilters`, `fields`, `orderBy`, `groupBy`. Joins are forward only (no reverse lookups from Branch to Loans). A segment that is not a Link field throws.

**Dynamic Link:** filter two plain conditions: `{ party_type: "Customer", party: "X" }`. There is no dot-path through a Dynamic Link.

### Child-table filters

`{ "items.item_code": "X" }` or the 4-item tuple. Compiles to `EXISTS (...)`, so each parent appears once. One level only (`table.column`).

### Fields, aggregates, grouping

```ts
await orm.getAll("Loan", {
  fields: [
    "member.group.branch.branch_name",
    "sum(amount) as total",
    "count(*) as loans",
  ],
  groupBy: "member.group.branch.branch_name",
  filters: { status: "Active" },
  orderBy: "total desc",
  limit: 50,
  offset: 0,
});
```

- Allowed aggregates: `count`, `sum`, `avg`, `min`, `max`, and `count(distinct x)`. Anything else with `(` is rejected.
- Default alias is `fn_field` (dots become `_`; `count(*)` becomes `count_all`).
- `count`, `sum`, `avg` values are converted to JS numbers. `min` / `max` are returned as the database gives them.
- `orderBy` accepts comma-separated parts and aggregate aliases. `distinct: true` adds `SELECT DISTINCT`.
- `limit` / `offset` must be non-negative integers.
- Not supported: `having`, nested AND/OR groups, multi-hop child filters.
- Do not use `getList` with aggregates. It would wrap result rows in `Document`.

## 6. Session and permissions

### Session

```ts
import { runWithSession, runAsAdministrator } from "nodra";

app.withSession({ user, roles, userPermissions }, () => handler()); // per request
app.asSystem(() => orm.getDoc("User", email)); // login, seeders, jobs
```

- `SessionContext = { user: string; roles: string[]; userPermissions?: Record<string, string[]> }`.
- Stored in `AsyncLocalStorage` on `globalThis[Symbol.for("nodra.sessionStore")]`, so duplicate module instances still share it.
- With a session, `owner` (insert) and `modified_by` (every save) come from `session.user`. Without one, behavior is the old default (`"Administrator"`).
- With `enforcePermissions` on and no session, every ORM call throws `PermissionError`.

### Permission rules (doctype meta)

```ts
permissions: [
  { role: "Loan Officer", read: true, write: true, create: true },
  { role: "Clerk", read: true, if_owner: true },
  { role: "Manager", read: true, submit: true, cancel: true, delete: true },
];
```

- Permission types: `read`, `write`, `create`, `delete`, `submit`, `cancel`.
- `Administrator` bypasses everything. Other roles need a matching rule, or the call throws `PermissionError`.
- If all matching rules have `if_owner`, the user sees and edits only their own documents.
- `userPermissions` limits users by linked value, e.g. `{ Branch: ["BR-01"] }`. It applies to the doctype's own `name` and to every Link field pointing at that doctype. Null link values are allowed in lists.
- List queries (`getList`, `getAll`, `getCount`, `exists`, `getValue` with enforcement on) add the restrictions as SQL conditions. `getDoc`, `insert`, `update`, `deleteDoc`, `setValue` check per document.
- Child tables, joined Link targets and aggregates are not separately permission-checked.

## 7. Naming

Doctype meta `autoname`:

| Value                      | Result                                         |
| -------------------------- | ---------------------------------------------- |
| (absent)                   | Legacy random hash, assigned before validation |
| `hash`                     | Random 10-char hash, assigned after validation |
| `field:fieldname`          | Name = that field's value (required)           |
| `prompt`                   | Caller must set `doc.name`                     |
| `series:LOAN-.YYYY.-.####` | `LOAN-2026-0001`. Counter per prefix           |

- Series tokens: `YYYY`, `YY`, `MM`, `DD`. The final segment must be `#` characters; the count is the zero-pad width.
- Counters live in table `nodra_series (name, counter)`, auto-created, incremented atomically with `INSERT ... ON CONFLICT DO UPDATE`. Gaps can occur if the INSERT fails after naming.
- A preset `doc.name` is never overridden.

## 8. Concurrency (stale check)

With `staleCheck`, `update`, `submit` and `cancel` lock the row (`SELECT ... FOR UPDATE`) and compare its `modified` with the `doc.modified` you loaded (millisecond precision). A mismatch throws `StaleDocumentError`. The check is skipped when the document has no `modified`. Atomicity needs `Database.transaction(fn)`; without it the compare still runs but is not atomic.

## 9. Submit and cancel

Doctype meta `is_submittable: true`. `docstatus`: 0 draft, 1 submitted, 2 cancelled.

- `insert` forces `docstatus = 0`.
- `submit` requires stored status 0, runs validation, hooks `beforeSubmit`, writes `docstatus = 1`, then `afterSave`, `onSubmit`, `onChange`.
- `cancel` requires stored status 1, hook `beforeCancel`, writes `docstatus = 2`, then `onCancel`, `onChange`. No validation.
- Editing a submitted doc only changes fields flagged `allow_on_submit: true`. Cancelled docs cannot be edited. Submitted docs cannot be deleted.
- Hooks `beforeSubmit`, `onSubmit`, `beforeCancel`, `onCancel` are optional methods on `Document`; they are called only if defined.
- Calling `submit` / `cancel` on a non-submittable doctype throws `DocStatusError`.
- Not implemented: amend, checks for linked documents on cancel.

## 10. Child tables (opt-in `childTables: true`)

- Table / Table MultiSelect fields are stored in the child doctype's table with columns `name, parent, parenttype, parentfield, idx, owner, creation, modified, modified_by, docstatus` plus the child's own fields.
- Save replaces all rows of a Table field that is present (not `undefined`) on the document: delete then re-insert, with `idx` = array position + 1. Row `name` is kept if given. Row names/creation are not diffed.
- `getDoc` loads children ordered by `idx`. `getList` / `getAll` do not.
- `deleteDoc` removes children. Everything runs in one transaction when `Database.transaction` exists.
- With `childTables` off, Table fields are written as ordinary columns (the original behavior).

## 11. Errors

| Error                                     | When                                                              |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `NotFoundError(doctype, name)`            | `getDoc` / `deleteDoc` missing row, `setValue` permission lookup  |
| `PermissionError`                         | Role, owner or user-permission denial; no session while enforcing |
| `StaleDocumentError`                      | Row changed since load                                            |
| `DocStatusError`                          | Wrong docstatus, non-submittable doctype, deleting submitted      |
| `Error("Invalid field name: ...")`        | Non-identifier in fields/filters/orderBy/groupBy/setValue         |
| `Error("Invalid aggregate: ...")`         | Unsupported aggregate expression                                  |
| `Error("... is not a Link field of ...")` | Bad dot-path segment                                              |

Map `PermissionError` to HTTP 403, `NotFoundError` to 404, `StaleDocumentError` to 409, `DocStatusError` to 409 or 422.

## 12. Security model

- Column and path names pass `^[A-Za-z_][A-Za-z0-9_]*$` per segment. Lowercase names are double-quoted.
- All values are bound parameters. Limit/offset are validated integers.
- Table names come from the registry via `toTableName`, never from user input. Unknown doctypes throw in `registry.get`.
- `getValue` / `setValue` reject non-identifier field names (older code interpolated them).
- In the legacy (non-compiler) `getList` path, `fields` and `orderBy` still go to `QueryBuilder` unchanged. Do not pass untrusted `fields` there. Untrusted input should use advanced syntax or be allow-listed by the caller.
- If `ResourceAPI` forwards query-string filters, clients can reach joins, operators and aggregates. Restrict what it forwards if that is not wanted.

## 13. Worked example: Loan

Doctypes: `Branch(branch_name)`, `Group(group_name, branch -> Branch)`, `Member(member_name, group -> Group)`, `Loan(member -> Member, amount, status)` with `autoname: "series:LOAN-.YYYY.-.####"`, `is_submittable: true`.

```ts
const app = await getNodra();
await app.withSession(
  {
    user: "u1",
    roles: ["Loan Officer"],
    userPermissions: { Branch: ["BR-01"] },
  },
  async () => {
    const loan = new Document(app.registry.get("Loan"), {
      member: "MEM-0001",
      amount: 50000,
      status: "Active",
    });
    await app.orm.insert(loan); // name: LOAN-2026-0001, owner/modified_by: u1
    await app.orm.submit(loan); // docstatus 1

    const rows = await app.orm.getAll("Loan", {
      fields: ["member.group.branch.branch_name", "sum(amount) as total"],
      groupBy: "member.group.branch.branch_name",
      orderBy: "total desc",
    });
  },
);
```

OR

```ts
await app.orm.transaction(async (tx) => {
  const loan = await tx.insert(
    new Document(app.registry.get("Loan"), { member: "MEM-1", amount: 50000 }),
  );
  await tx.submit(loan);
  await tx.setValue("Member", "MEM-1", "last_loan", loan.name);
});
// all three commit together; if any throws, none are saved
```

## 14. Known gaps (do not assume these exist)

`having`, nested filter groups, amend, naming by field with format, Single and tree doctypes, `fetch_from`, default values, field-type casting, row-level child validation, version history, rename/duplicate, link-integrity checks on delete, field-level permission levels, caching. The ORM has not been run against a production database in this repo; verify behavior with tests before relying on it.
