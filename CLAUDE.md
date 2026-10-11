# CLAUDE.md - Nodra AI Development Guidelines

This document defines the engineering standards, architecture rules, development workflow, and verification requirements for AI-assisted development of the Nodra framework.

## Project Overview

Nodra is a metadata-driven web framework built with:

- Node.js
- TypeScript
- PostgreSQL
- TanStack Start
- Custom Nodra ORM
- Metadata-driven DocTypes
- Server-side Methods
- Resource APIs
- Session-based authentication
- Role and permission management

Nodra is designed as a modular framework for building business applications with strongly typed metadata, reusable backend services, database-backed documents, authentication, permissions, and APIs.

**Important:** Nodra is its own framework. Do not introduce concepts, architecture, naming, dependencies, or implementation patterns from other frameworks unless explicitly requested.

---

# Development Workflow

## 1. Git Worktrees — Required

All feature development MUST use Git worktrees for isolation.

Worktree directory:

```text
.worktrees/
```

Create a worktree:

```bash
git worktree add .worktrees/feature-name -b feature/feature-name
cd .worktrees/feature-name
pnpm install
```

### Why worktrees?

- Isolated development environments
- No stashing or branch switching overhead
- Clean separation of work
- Safer parallel development
- Required for feature work

Do not perform feature development directly on the main working tree when a worktree is appropriate.

---

# 2. Plan-Driven Development

For any task requiring **2 or more meaningful implementation steps**, create a plan before modifying production code.

Plans directory:

```text
docs/plans/
```

Naming:

```text
docs/plans/YYYY-MM-DD-<feature-name>.md
```

The plan should:

1. Define the goal.
2. Describe the architecture.
3. Identify affected files.
4. Define tests.
5. Define implementation steps.
6. Define verification commands.
7. Identify dependencies or risks.

For complex tasks, use the available planning workflow before implementation.

### Plan Template

````markdown
# Feature Implementation Plan

## Goal

One sentence describing what this builds.

## Architecture

Describe the architectural approach.

## Tech Stack

List relevant technologies and modules.

---

## Task 1: Component Name

### Files

- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts`
- Test: `tests/exact/path/to/test.ts`

### Step 1: Write the failing test

```typescript
// Test
```
````

### Step 2: Run the test

```bash
pnpm vitest run tests/path/test.ts
```

Expected:

```text
FAIL
```

### Step 3: Implement the minimum required code

```typescript
// Implementation
```

### Step 4: Run the test again

```bash
pnpm vitest run tests/path/test.ts
```

Expected:

```text
PASS
```

### Step 5: Commit

```bash
git add ...
git commit -m "feat(scope): description"
```

````

---

# 3. Test-Driven Development

## Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

Use the Red-Green-Refactor cycle:

### RED

Write one minimal failing test.

### VERIFY RED

Run the test and confirm that it fails for the expected reason.

### GREEN

Write the minimum production code necessary to make the test pass.

### VERIFY GREEN

Run the test and confirm that it passes.

### REFACTOR

Improve the implementation while keeping all tests green.

Do not write large amounts of production code first and add tests afterward.

---

# 4. Verification Requirements

Before claiming that work is complete:

1. Identify what command proves the claim.
2. Run the command.
3. Read the complete relevant output.
4. Check the exit code.
5. Check for failures and warnings.
6. Confirm that the result actually proves the claim.
7. Report the verification result.

Previous command executions do not count as fresh verification when the code has changed.

---

# 5. Mandatory Verification

Before completion, run the appropriate project checks.

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
````

When available:

```bash
pnpm test:coverage
pnpm format:check
```

Do not claim:

> "Tests pass"

unless the tests were actually executed and passed.

Do not claim:

> "Build works"

unless the build was actually executed successfully.

---

# Code Quality Standards

## TypeScript

- `strict: true` must remain enabled.
- Do not use `any`.
- Prefer `unknown` with explicit type narrowing.
- Public APIs should have explicit return types.
- Avoid unnecessary type assertions.
- Do not use `@ts-ignore`.
- Do not use `@ts-expect-error` unless there is a documented reason.
- Preserve strong typing across framework boundaries.
- Do not weaken types simply to make compilation pass.

---

# Testing Standards

## Unit Tests

Location:

```text
tests/unit/
```

Unit tests should:

- Test one behavior at a time.
- Avoid external services.
- Mock database infrastructure where appropriate.
- Be deterministic.
- Be fast.

## Integration Tests

Location:

```text
tests/integration/
```

Integration tests should use real infrastructure when testing:

- PostgreSQL behavior
- Database transactions
- ORM behavior
- Metadata synchronization
- Authentication persistence
- Redis sessions
- Permission enforcement

## Test Naming

Test names should describe behavior.

Good:

```text
should reject login when password is invalid
```

Bad:

```text
test login
```

---

# Error Handling

Use Nodra's error hierarchy.

Do not introduce arbitrary plain `Error` instances for framework-level errors when an appropriate Nodra error exists.

Errors should contain useful context where applicable:

- Doctype
- Document name
- Field name
- Value
- Method
- User
- Permission
- Database operation

Errors should be safe for API responses and must not expose secrets.

Never expose:

- Password hashes
- Session tokens
- API secrets
- Database credentials
- Private keys

---

# Naming Conventions

| Item            | Convention       | Example            |
| --------------- | ---------------- | ------------------ |
| Files           | kebab-case       | `query-builder.ts` |
| Classes         | PascalCase       | `QueryBuilder`     |
| Functions       | camelCase        | `getDocType()`     |
| Variables       | camelCase        | `queryBuilder`     |
| Constants       | UPPER_SNAKE_CASE | `MAX_POOL_SIZE`    |
| Database tables | snake_case       | `tab_user`         |
| Methods         | dot notation     | `auth.login`       |
| DocTypes        | PascalCase       | `Customer`         |
| Fields          | snake_case       | `full_name`        |

Follow existing naming patterns when modifying an established module.

---

# Nodra Architecture

Nodra follows a layered architecture.

```text
Client
  ↓
Resource / Method API
  ↓
Method
  ↓
Service
  ↓
ORM
  ↓
Database
```

## Resource

Resources provide generic document-oriented API operations.

Use Resources for:

- Generic CRUD
- Document retrieval
- Document creation
- Document updates
- Document deletion
- Standard list operations

Resources should not become containers for complex business rules.

---

## Method

Methods represent explicit application operations.

Examples:

```text
auth.login
auth.logout
auth.me
loan.approve
loan.disburse
loan.close
collection.submit
```

Methods are the preferred boundary for business operations.

A Method should:

- Validate its input.
- Authenticate when required.
- Check authorization.
- Call the appropriate service.
- Return a predictable result.

Avoid putting complex business logic directly inside HTTP route handlers.

---

## Service

Services contain business logic.

Example:

```text
Method
  ↓
LoanService
  ↓
ORM
```

Services should not depend on HTTP-specific objects unless there is a strong architectural reason.

---

## ORM

The Nodra ORM is responsible for database document operations.

Typical responsibilities:

- Insert
- Get document
- Update
- Delete
- List
- Count
- Query
- Transactions
- Metadata-aware database access
- Validation integration
- Permission-aware access

**Before modifying ORM, DocTypes, sessions, or permissions:**

```text
Read docs/NODRA_ORM.md
```

This is mandatory.

---

# Authentication Architecture

Nodra uses server-side sessions.

The authentication flow is:

```text
Client
  ↓
auth.login
  ↓
Validate credentials
  ↓
Create session
  ↓
Store session
  ↓
Return session cookie/token
```

Authenticated requests:

```text
Request
  ↓
Session token
  ↓
Session store
  ↓
Session
  ↓
Authenticated user
  ↓
Authorization
  ↓
Method / Resource
  ↓
ORM
```

## System Context

Nodra supports a system execution context through:

```ts
asSystem();
```

System context is intended for operations that legitimately occur without an authenticated user.

Examples:

- Login user lookup
- Database migrations
- Initial system setup
- Seed operations
- Internal maintenance
- Trusted background jobs

Example:

```ts
app.asSystem(() =>
  app.auth.login({
    username,
    password,
  }),
);
```

### Important

`asSystem()` is a privileged execution context.

Do **not** use it to bypass normal authorization for ordinary user requests.

Bad:

```ts
app.asSystem(() => deleteCustomer(id));
```

when the operation originates from a normal user request.

Correct architecture:

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Service
  ↓
ORM
```

System context should only be used when the operation itself is a trusted system operation.

---

# Sessions

Sessions are server-side state.

Do not replace the session architecture with JWTs, stateless authentication, or another mechanism unless explicitly requested.

Session responsibilities include:

- Authentication state
- Session expiration
- Logout
- Logout-all
- Session invalidation
- User association

Never log raw session tokens.

---

# Permissions

Permission checks must occur at the correct architectural layer.

Do not solve permission problems by globally disabling authorization.

When changing permission behavior:

1. Identify the current execution context.
2. Identify the authenticated user.
3. Identify the user's roles.
4. Identify the requested resource/document.
5. Determine the intended permission.
6. Add or update tests.
7. Verify both allowed and denied cases.

Always test authorization boundaries.

---

# DocTypes

DocTypes define metadata for Nodra documents.

Before changing a DocType:

1. Read `docs/NODRA_ORM.md`.
2. Inspect the existing DocType definition.
3. Inspect related fields and references.
4. Check metadata synchronization behavior.
5. Add/update tests.
6. Verify database changes.

Do not manually modify generated database structures unless the architecture explicitly requires it.

---

# Database

Nodra uses PostgreSQL as its primary relational database.

Database code must:

- Use parameterized queries.
- Avoid SQL injection.
- Preserve transaction boundaries.
- Handle connection cleanup.
- Respect metadata definitions.
- Preserve decimal/numeric precision.
- Avoid unnecessary queries.

Do not introduce a second ORM without explicit architectural approval.

---

# API Design

HTTP routes should remain thin.

Preferred flow:

```text
HTTP Route
  ↓
Method Registry
  ↓
Method
  ↓
Service
  ↓
ORM
```

Do not duplicate business logic between:

- HTTP routes
- Server functions
- Methods
- Resources

A business operation should have one canonical implementation.

---

# Method Registry

Methods are registered through the Nodra Method Registry.

Example:

```ts
registry.register(
  "auth.me",
  async (ctx) => {
    return {
      authenticated: true,
      user: ctx.user,
    };
  },
  {
    requireAuth: true,
  },
);
```

Method middleware may handle:

- Authentication
- Authorization
- Validation
- Logging
- Request context
- Error handling

Keep cross-cutting concerns in middleware rather than duplicating them inside every Method.

---

# Resource API

The Resource API is intended for generic document operations.

Conceptually:

```text
Resource
  ↓
ORM
```

Business-specific workflows should normally use Methods:

```text
Method
  ↓
Service
  ↓
ORM
```

Do not turn the Resource API into a replacement for business services.

---

# Git Commit Convention

Use Conventional Commits.

Format:

```text
<type>(<scope>): <description>
```

Types:

```text
feat
fix
test
refactor
docs
chore
perf
ci
```

Scopes may include:

```text
core
doctype
document
database
orm
api
auth
permissions
workflow
hooks
events
jobs
realtime
files
report
cli
app
migration
```

Examples:

```bash
feat(core): add document validation engine

fix(api): correct method error status

test(orm): add document filtering tests

refactor(auth): simplify session resolution

docs(orm): document query behavior
```

## Commit Frequency

Prefer:

```text
One logical unit = one commit
```

Do not combine unrelated changes.

---

# Project Structure

```text
nodra/
├── .github/
│   └── workflows/
├── .worktrees/
├── docs/
│   ├── plans/
│   ├── en/
│   └── zh/
├── doctypes/
├── packages/
│   └── nodra/
│       ├── src/
│       │   ├── core/
│       │   ├── database/
│       │   ├── orm/
│       │   ├── api/
│       │   ├── auth/
│       │   ├── permissions/
│       │   ├── workflow/
│       │   ├── hooks/
│       │   ├── events/
│       │   ├── jobs/
│       │   ├── files/
│       │   ├── report/
│       │   └── cli/
│       └── tests/
├── apps/
│   ├── todo/
│   └── mfi/
├── tests/
├── CLAUDE.md
└── AGENTS.md
```

Always inspect the actual repository structure before assuming a path exists.

---

# Module Quick Reference

## Core

Location:

```text
packages/nodra/src/core/
```

Responsibilities:

- Framework configuration
- DocType metadata
- Document definitions
- Registry
- Validation
- Framework errors

---

## Database

Location:

```text
packages/nodra/src/database/
```

Responsibilities:

- PostgreSQL connections
- Transactions
- Query infrastructure
- Metadata synchronization
- Database utilities

---

## ORM

Location:

```text
packages/nodra/src/orm/
```

Responsibilities:

- Document CRUD
- Queries
- Filtering
- Transactions
- Database abstraction
- Permission-aware document access

**Read `docs/NODRA_ORM.md` before modifying this module.**

---

## API

Location:

```text
packages/nodra/src/api/
```

Responsibilities:

- Method registry
- Method execution
- Middleware
- Resource API
- API errors
- Request context

---

## Authentication

Location:

```text
packages/nodra/src/auth/
```

Responsibilities:

- Login
- Logout
- Password verification
- Sessions
- Session stores
- Authentication identities

---

## Permissions

Location:

```text
packages/nodra/src/permissions/
```

Responsibilities:

- Role permissions
- Document permissions
- Field permissions
- User authorization
- Permission evaluation

---

# Development Commands

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Testing

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## Type Checking

```bash
pnpm typecheck
```

## Linting

```bash
pnpm lint
pnpm lint:fix
```

## Formatting

```bash
pnpm format
pnpm format:check
```

---

# Pre-Commit Checklist

Before committing:

- [ ] Work is isolated in the appropriate Git worktree
- [ ] Tests were written for new behavior
- [ ] Tests pass
- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Formatting passes
- [ ] No unnecessary dependencies were added
- [ ] No unrelated files were modified
- [ ] No secrets were committed
- [ ] Commit follows Conventional Commits
- [ ] Documentation was updated when architecture changed

---

# Completion Checklist

Before declaring a task complete:

```text
1. Inspect
2. Plan
3. Write failing test
4. Verify failure
5. Implement
6. Verify success
7. Run full relevant test suite
8. Run typecheck
9. Run lint
10. Run build when applicable
11. Review changed files
12. Report evidence
```

Do not declare completion based only on static inspection.

---

# Troubleshooting

## Tests fail in CI but pass locally

Check:

- Node.js version
- pnpm version
- Environment variables
- PostgreSQL version
- Redis availability
- Database state
- Test isolation

Clean installation:

```bash
rm -rf node_modules
pnpm install
```

---

## Type errors

Run:

```bash
pnpm typecheck
```

Fix the root cause.

Do not:

- Add `any`
- Add `@ts-ignore`
- Remove strict checks
- Hide errors with unsafe casts

---

## Lint errors

Run:

```bash
pnpm lint
```

Use:

```bash
pnpm lint:fix
```

for safe automatic fixes.

Manually fix issues that require architectural or type decisions.

---

# Documentation Rules

When changing architecture, update the relevant documentation.

Important documentation:

```text
docs/NODRA_ORM.md
docs/en/ARCHITECTURE.md
docs/en/API_REFERENCE.md
```

Before touching:

- ORM
- DocTypes
- Sessions
- Permissions

read:

```text
docs/NODRA_ORM.md
```

This requirement applies to AI-assisted development as well.

---

# AI Development Rules

AI agents working on Nodra MUST:

1. Inspect the existing implementation before proposing changes.
2. Prefer existing Nodra abstractions over introducing new ones.
3. Do not invent APIs that do not exist.
4. Do not assume file paths without checking the repository.
5. Do not rewrite working architecture unnecessarily.
6. Follow the existing module boundaries.
7. Write tests before production code for new behavior.
8. Keep changes focused.
9. Avoid unnecessary dependencies.
10. Verify changes with actual commands.
11. Read relevant documentation before modifying core infrastructure.
12. Preserve backward compatibility unless a breaking change is explicitly requested.
13. Never silently change authentication or permission semantics.
14. Never bypass authorization merely to make a test or feature pass.
15. Never expose secrets, passwords, tokens, or credentials.

---

# Architecture Decision Rules

When multiple implementation approaches are possible:

### Prefer

1. Existing Nodra abstraction
2. Existing module
3. Existing dependency
4. Smallest correct implementation
5. Strong typing
6. Testable design
7. Backward-compatible behavior

### Avoid

- Unnecessary abstractions
- Duplicate business logic
- New dependencies for trivial functionality
- Global mutable state
- Hidden side effects
- Framework-specific hacks
- Copying architecture from unrelated frameworks
- Large refactors unrelated to the requested task

---

# Security Rules

Never commit:

```text
.env
.env.*
passwords
API keys
session tokens
private keys
database credentials
Redis credentials
production secrets
```

Never log:

```text
password
passwordHash
session token
API key
authorization header
cookie containing authentication credentials
```

Authentication and authorization changes require tests.

---

# Last Updated

2026-10-05
