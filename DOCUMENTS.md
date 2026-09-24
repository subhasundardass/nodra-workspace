# Nodra: DocType, Resource and Document

## 1. Overview

Nodra is a metadata-driven application framework.

The central idea is that an application's business data should be described through **DocTypes**, manipulated through **Documents**, and exposed to application code through **Resources**.

The three concepts have different responsibilities:

| Concept      | Responsibility                  | Example                              |
| ------------ | ------------------------------- | ------------------------------------ |
| **DocType**  | Defines what a record is        | `Loan`                               |
| **Document** | Represents one actual record    | `Loan/LOAN-00001`                    |
| **Resource** | Provides CRUD access to records | `resource.get("Loan", "LOAN-00001")` |

A useful mental model is:

```text
                    DocType
                       │
              defines structure
                       │
                       ▼
                ┌─────────────┐
                │   Document  │
                │             │
                │ Loan #001   │
                └─────────────┘
                       ▲
                       │
                 loaded/created
                       │
                ┌─────────────┐
                │   Resource  │
                │             │
                │ get/list/   │
                │ create/...  │
                └─────────────┘
```

The architecture should remain separated:

```text
DocType
  ↓
metadata

Document
  ↓
runtime business object

Resource
  ↓
application-facing CRUD interface

ORM
  ↓
persistence

Database
```

---

# 2. DocType

## 2.1 What is a DocType?

A **DocType** is the metadata definition of a business object.

It answers questions such as:

- What is this object called?
- Which fields does it have?
- What type is each field?
- Which fields are required?
- How should names be generated?
- Which roles can access it?
- Is it submitted?
- Is it a child table?
- Which field should represent its title?
- How should lists be sorted?
- Which fields should be searchable?

For example:

```json
{
  "name": "Todo",
  "module": "Core",
  "naming_rule": "hash",

  "fields": [
    {
      "fieldname": "title",
      "fieldtype": "Data",
      "label": "Title",
      "reqd": true
    },

    {
      "fieldname": "completed",
      "fieldtype": "Check",
      "label": "Completed"
    }
  ]
}
```

The DocType is **not a database row**.

It is metadata describing the database rows.

---

# 3. DocType as the Source of Truth

Nodra's design treats the DocType as the central source of truth.

From one DocType, the framework can derive:

```text
DocType
   │
   ├── Database schema
   │
   ├── Validation
   │
   ├── Permissions
   │
   ├── List views
   │
   ├── Form views
   │
   ├── Search
   │
   ├── Resource operations
   │
   ├── Document metadata
   │
   └── UI field definitions
```

This is one of the most important architectural principles of Nodra.

The application should describe the business model once instead of independently describing:

```text
Database model
+
API model
+
Form model
+
List model
+
Validation model
```

---

# 4. DocType Definition

The main interface is:

```ts
interface DocTypeDefinition {
  name: string;
  module: string;
  naming_rule: NamingRule;

  is_submittable: boolean;
  is_child: boolean;
  is_single: boolean;
  is_tree: boolean;
  is_virtual: boolean;

  fields: FieldDefinition[];

  permissions: PermissionRule[];

  field_permissions?: FieldPermissionRule[];

  search_fields?: string[];

  title_field?: string;

  sort_field?: string;

  sort_order?: "asc" | "desc";

  hooks?: Record<string, unknown>;
}
```

---

# 5. DocType Name

```ts
name: "Loan";
```

The name uniquely identifies the DocType.

It is used by:

```ts
registry.get("Loan");
```

and:

```ts
resource.get("Loan", "...");
```

The name is also used to derive the database table.

For example:

```text
Loan
```

becomes:

```text
tab_loan
```

A DocType such as:

```text
Sales Invoice
```

becomes:

```text
tab_sales_invoice
```

---

# 6. Module

```ts
module: "MFI";
```

The module groups related DocTypes.

For example:

```text
MFI
├── Branch
├── Group
├── Member
├── Loan
├── Installment
└── Collection
```

Another application could have:

```text
CRM
├── Customer
├── Lead
└── Opportunity
```

Modules are primarily organizational metadata.

---

# 7. Naming Rules

Nodra supports:

```ts
type NamingRule =
  "autoincrement" | "hash" | "field" | "format" | "prompt" | "expression";
```

## 7.1 Hash

```json
{
  "naming_rule": "hash"
}
```

Generates a random identifier.

Example:

```text
8f31a92c10
```

---

## 7.2 Auto Increment

Conceptually:

```text
1
2
3
4
```

This is intended for sequence-based names.

---

## 7.3 Field

The document name comes from another field.

For example:

```text
Member
member_code = MEM-0001
```

The document name could become:

```text
MEM-0001
```

---

## 7.4 Format

A formatted name can use a pattern such as:

```text
LOAN-{####}
```

Result:

```text
LOAN-0001
LOAN-0002
LOAN-0003
```

---

## 7.5 Prompt

The application/user supplies the name.

Example:

```text
Document name:
CUSTOMER-001
```

---

## 7.6 Expression

The name can eventually be generated from an expression.

This is useful for application-specific naming schemes.

---

# 8. Fields

A DocType contains fields.

```ts
interface FieldDefinition {
  fieldname: string;
  fieldtype: FieldType;
  label: string;

  reqd?: boolean;
  unique?: boolean;
  default?: unknown;

  max_length?: number;
  options?: string | string[];

  hidden?: boolean;
  read_only?: boolean;

  in_list_view?: boolean;
  in_standard_filter?: boolean;

  search_index?: boolean;

  description?: string;

  depends_on?: string;

  precision?: number;
}
```

Example:

```json
{
  "fieldname": "member_name",
  "fieldtype": "Data",
  "label": "Member Name",
  "reqd": true,
  "in_list_view": true
}
```

---

# 9. Field Types

Nodra currently defines these field types:

```text
Data
Int
Float
Currency

Date
Datetime
Time

Text
LongText
SmallText

Check
Select

Link
DynamicLink
Table

Attach
AttachImage

Color
JSON
Password

ReadOnly
HTML
```

Some field types represent database columns while others are virtual.

For example:

```text
Table
ReadOnly
```

do not directly create ordinary database columns.

---

# 10. Field Properties

## reqd

Required field:

```json
{
  "fieldname": "title",
  "fieldtype": "Data",
  "label": "Title",
  "reqd": true
}
```

---

## unique

```json
{
  "fieldname": "email",
  "fieldtype": "Data",
  "label": "Email",
  "unique": true
}
```

---

## default

```json
{
  "fieldname": "active",
  "fieldtype": "Check",
  "label": "Active",
  "default": true
}
```

---

## hidden

Controls UI visibility:

```json
{
  "fieldname": "internal_code",
  "fieldtype": "Data",
  "label": "Internal Code",
  "hidden": true
}
```

---

## read_only

```json
{
  "fieldname": "balance",
  "fieldtype": "Currency",
  "label": "Balance",
  "read_only": true
}
```

---

## in_list_view

```json
{
  "fieldname": "member_name",
  "fieldtype": "Data",
  "label": "Member Name",
  "in_list_view": true
}
```

This allows metadata-driven list views.

---

## in_standard_filter

```json
{
  "fieldname": "branch",
  "fieldtype": "Link",
  "label": "Branch",
  "options": "Branch",
  "in_standard_filter": true
}
```

---

## search_index

```json
{
  "fieldname": "member_name",
  "fieldtype": "Data",
  "label": "Member Name",
  "search_index": true
}
```

---

## depends_on

Allows conditional UI behavior.

Example:

```json
{
  "fieldname": "company_name",
  "fieldtype": "Data",
  "label": "Company Name",
  "depends_on": "type == 'Company'"
}
```

---

# 11. Standard Fields

Every normal Nodra Document has standard fields:

```text
name
owner
creation
modified
modified_by
docstatus
idx
```

Conceptually:

```text
┌───────────────────────────────────┐
│ Document                          │
├───────────────────────────────────┤
│ name                              │
│ owner                             │
│ creation                          │
│ modified                          │
│ modified_by                       │
│ docstatus                         │
│ idx                               │
├───────────────────────────────────┤
│ application fields                │
│                                   │
│ title                             │
│ branch                            │
│ amount                            │
│ status                            │
└───────────────────────────────────┘
```

These fields provide common framework behavior.

---

# 12. DocStatus

Nodra uses:

```text
0 = Draft
1 = Submitted
2 = Cancelled
```

This provides a basic document lifecycle.

Workflow can add a separate business state such as:

```text
Draft
Pending Approval
Approved
Rejected
Disbursed
Closed
```

The two concepts should remain separate:

```text
docstatus
    ↓
framework lifecycle

workflow_state
    ↓
business workflow
```

---

# 13. Submittable DocTypes

A DocType can be marked:

```json
{
  "is_submittable": true
}
```

This means the document participates in submission/cancellation lifecycle.

Typical examples:

```text
Loan
Invoice
Payment
Journal Entry
```

---

# 14. Child DocTypes

A child DocType represents rows belonging to a parent document.

Example:

```text
Loan
│
├── Installments
│   ├── Installment 1
│   ├── Installment 2
│   └── Installment 3
```

Child tables receive:

```text
parent
parenttype
parentfield
idx
```

This allows Nodra to understand the relationship between parent and child records.

---

# 15. Single DocTypes

```ts
is_single: true;
```

A single DocType represents singleton configuration rather than a normal collection of business records.

Examples could include:

```text
System Settings
Company Settings
Accounting Settings
```

Conceptually:

```text
Settings
   ↓
one logical record
```

rather than:

```text
Settings
   ↓
many records
```

---

# 16. Tree DocTypes

```ts
is_tree: true;
```

Tree DocTypes represent hierarchical structures.

Example:

```text
Assets
├── Current Assets
│   ├── Cash
│   └── Bank
└── Fixed Assets
    ├── Building
    └── Equipment
```

Useful for:

```text
Chart of Accounts
Categories
Organization structures
Territories
```

---

# 17. Virtual DocTypes

```ts
is_virtual: true;
```

A virtual DocType does not necessarily map directly to a physical database table.

This is useful for metadata or computed resources.

---

# 18. Permissions

DocTypes contain role-level permissions.

```ts
interface PermissionRule {
  role: string;

  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;

  submit: boolean;
  cancel: boolean;
  amend: boolean;

  if_owner: boolean;
}
```

Example:

```json
{
  "role": "ACCOUNTANT",
  "read": true,
  "write": true,
  "create": true,
  "delete": false,
  "submit": true,
  "cancel": false,
  "amend": false,
  "if_owner": false
}
```

Permissions describe **what a role may do**.

They should not be confused with workflow.

```text
Permission
    ↓
Can this user perform this operation?

Workflow
    ↓
Is this transition valid from the current state?
```

Both checks should happen before sensitive operations.

---

# 19. Field Permissions

Nodra also supports field-level permissions.

Example:

```json
{
  "role": "FIELD_OFFICER",
  "read": ["member_name", "phone"],
  "write": ["phone"]
}
```

This allows:

```text
FIELD_OFFICER
    ↓
can read member_name
can read phone
can edit phone
cannot edit other protected fields
```

---

# 20. DocType Registry

DocTypes are registered with the `DocTypeRegistry`.

Conceptually:

```ts
registry.register(loanDocType);
```

Then:

```ts
registry.get("Loan");
```

The registry also supports:

```ts
registry.has("Loan");

registry.list();

registry.listByModule("MFI");

registry.getLinkedDocTypes("Member");
```

The registry is the runtime metadata catalog.

---

# 21. Document

## 21.1 What is a Document?

A **Document is one runtime instance of a DocType**.

If:

```text
DocType = Loan
```

then:

```text
Document = Loan #LOAN-0001
```

A DocType describes the structure.

A Document contains the actual values.

```text
DocType
──────────────
Loan
fields:
  member
  amount
  interest_rate


Document
──────────────
name = LOAN-0001
member = MEM-001
amount = 50000
interest_rate = 18
```

This distinction is fundamental.

---

# 22. Document Class

Nodra currently provides:

```ts
export class Document
```

The Document contains:

```ts
doctype: string;

name: string;

owner: string;

creation: Date | null;

modified: Date | null;

modified_by: string;

docstatus: number;

idx: number;
```

and application fields are held dynamically.

---

# 23. Creating a Document

Conceptually:

```ts
const doc = new Document(meta, {
  title: "Buy groceries",
});
```

The Document receives its metadata from the DocType.

For application controllers, Nodra also supports a Document factory.

For example:

```ts
class Todo extends Document {
  async validate() {
    // custom business validation
  }
}
```

The Resource API can use that controller through a `DocumentFactory`.

This is important because it lets application-specific behavior remain outside the framework core.

---

# 24. Reading Fields

Use:

```ts
doc.get("title");
```

Example:

```ts
const title = doc.get("title");
```

Standard fields work the same way:

```ts
doc.get("name");
doc.get("owner");
doc.get("docstatus");
```

---

# 25. Setting Fields

Use:

```ts
doc.set("title", "Buy groceries");
```

For example:

```ts
doc.set("amount", 50000);
doc.set("interest_rate", 18);
```

The Document does not need a separate TypeScript property for every application field.

This allows one generic Document class to work with arbitrary DocTypes.

---

# 26. Reading All Data

```ts
const data = doc.getData();
```

This returns the document's standard and custom fields.

Conceptually:

```ts
{
  doctype: "Loan",
  name: "LOAN-0001",
  owner: "Administrator",
  creation: ...,
  modified: ...,
  modified_by: "Administrator",
  docstatus: 0,
  idx: 0,

  member: "MEM-001",
  amount: 50000,
  interest_rate: 18
}
```

---

# 27. New Documents

A Document can determine whether it is new:

```ts
doc.isNew();
```

For a newly created document:

```ts
true;
```

After successful persistence:

```ts
false;
```

This is important for lifecycle logic.

For example:

```ts
async validate() {
  if (this.isNew()) {
    // creation-specific validation
  }
}
```

---

# 28. Change Tracking

Documents track their previous clean state.

```ts
doc.hasChanged("amount");
```

You can retrieve the previous value:

```ts
doc.getPrevious("amount");
```

And retrieve all changed fields:

```ts
doc.getChangedFields();
```

Example:

```text
Before:

amount = 50000
interest = 18

After:

amount = 60000
interest = 18
```

Then:

```ts
doc.hasChanged("amount");
// true

doc.hasChanged("interest");
// false
```

and:

```ts
doc.getPrevious("amount");
// 50000
```

---

# 29. Marking a Document Clean

After successful persistence:

```ts
doc.markAsClean();
```

The current values become the new comparison baseline.

This prevents a successfully saved document from remaining permanently "dirty".

---

# 30. Document Lifecycle

Documents provide lifecycle hooks.

Current hooks include:

```ts
beforeValidate();
validate();

beforeSave();
afterSave();

beforeInsert();
afterInsert();

beforeDelete();
afterDelete();

onChange();
```

A simplified insert lifecycle is:

```text
insert()
   │
   ▼
beforeValidate
   │
   ▼
validate
   │
   ▼
framework validation
   │
   ▼
beforeInsert
   │
   ▼
beforeSave
   │
   ▼
DATABASE INSERT
   │
   ▼
afterSave
   │
   ▼
afterInsert
```

Update:

```text
update()
   │
   ▼
beforeValidate
   │
   ▼
validate
   │
   ▼
framework validation
   │
   ▼
beforeSave
   │
   ▼
DATABASE UPDATE
   │
   ▼
afterSave
   │
   ▼
onChange
```

Delete:

```text
delete()
   │
   ▼
beforeDelete
   │
   ▼
DATABASE DELETE
   │
   ▼
afterDelete
```

---

# 31. Document Controllers

This is where Nodra becomes extensible.

A DocType can have an application controller.

For example:

```text
doctypes/
└── loan/
    ├── loan.json
    └── loan.ts
```

The metadata:

```text
loan.json
```

defines:

```text
fields
permissions
naming
metadata
```

The controller:

```text
loan.ts
```

defines:

```text
business logic
validation
lifecycle hooks
custom behavior
```

Example:

```ts
export class Loan extends Document {
  async validate() {
    const amount = Number(this.get("amount"));

    if (amount <= 0) {
      throw new Error("Loan amount must be greater than zero");
    }
  }

  async beforeInsert() {
    // application-specific logic
  }
}
```

This separation should be preserved.

---

# 32. Resource

## 32.1 What is a Resource?

A **Resource is the application-facing CRUD interface for a DocType**.

It provides operations such as:

```text
get
list
create
update
delete
```

The current implementation is `ResourceAPI`.

Example:

```ts
resource.get("Loan", "LOAN-0001");

resource.list("Loan");

resource.create("Loan", data);

resource.update("Loan", "LOAN-0001", data);

resource.delete("Loan", "LOAN-0001");
```

---

# 33. Resource is not the ORM

This distinction is important.

Nodra currently intentionally separates:

```text
Resource
   ↓
application-facing API

ORM
   ↓
persistence + lifecycle

Database
   ↓
actual storage
```

Resource delegates to ORM.

It should not duplicate database logic.

For example:

```ts
resource.create(...)
```

eventually calls:

```ts
orm.insert(...)
```

---

# 34. Resource Get

```ts
const loan = await resource.get("Loan", "LOAN-0001");
```

Conceptually:

```text
Resource
   ↓
ORM.getDoc()
   ↓
Database
   ↓
Document
```

The returned value is a `Document`.

---

# 35. Resource List

```ts
const result = await resource.list("Loan");
```

Result:

```ts
{
  data: Document[],
  meta: {
    total_count: 100
  }
}
```

This is intentionally different from returning only an array.

The metadata supports:

```text
pagination
count
future cursor information
```

---

# 36. Resource List Options

Resource list options currently inherit ORM list options:

```ts
interface ListOptions {
  filters?: Record<string, unknown>;
  fields?: string[];
  orderBy?: string;
  limit?: number;
  offset?: number;
}
```

Example:

```ts
await resource.list("Loan", {
  filters: {
    branch: "BR-001",
    docstatus: 1,
  },

  fields: ["name", "member", "amount"],

  orderBy: "creation desc",

  limit: 20,

  offset: 40,
});
```

Conceptually:

```text
filters
    ↓
WHERE

fields
    ↓
SELECT

orderBy
    ↓
ORDER BY

limit
    ↓
LIMIT

offset
    ↓
OFFSET
```

---

# 37. Resource Create

```ts
const loan = await resource.create("Loan", {
  member: "MEM-001",
  amount: 50000,
});
```

Internally:

```text
Resource.create()
       ↓
DocumentFactory
       ↓
Document
       ↓
ORM.insert()
       ↓
validation
       ↓
lifecycle
       ↓
database
```

The important advantage is that custom controllers can participate.

---

# 38. Resource Update

```ts
await resource.update("Loan", "LOAN-0001", {
  amount: 60000,
});
```

Nodra first loads the existing Document.

```text
get existing Document
       ↓
set fields
       ↓
ORM.update()
       ↓
validation
       ↓
lifecycle
       ↓
database
```

Loading the existing Document first is important because it preserves previous values for change tracking and lifecycle hooks.

---

# 39. Resource Delete

```ts
await resource.delete("Loan", "LOAN-0001");
```

Internally:

```text
Resource.delete()
       ↓
ORM.deleteDoc()
       ↓
load Document
       ↓
beforeDelete
       ↓
DELETE
       ↓
afterDelete
```

---

# 40. ORM

The ORM is the persistence layer between Documents and the database.

Current CRUD API includes:

```ts
insert();
getDoc();
getList();
update();
deleteDoc();

getCount();
getValue();
setValue();
exists();
```

The ORM knows about:

```text
DocType metadata
Document
Database
QueryBuilder
Validation
Lifecycle
```

Resource does not need to know SQL.

---

# 41. Complete Architecture

The relationship should be understood as:

```text
                         ┌───────────────┐
                         │    DocType    │
                         │   Metadata    │
                         └───────┬───────┘
                                 │
                   describes     │
                                 ▼
                         ┌───────────────┐
                         │   Document    │
                         │ Runtime Data  │
                         └───────┬───────┘
                                 ▲
                                 │
                         creates/loads
                                 │
                         ┌───────┴───────┐
                         │    Resource   │
                         │ Application   │
                         │     API       │
                         └───────┬───────┘
                                 │
                              delegates
                                 ▼
                         ┌───────────────┐
                         │      ORM      │
                         │ Persistence   │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   Database    │
                         └───────────────┘
```

---

# 42. Example: Todo

Suppose we define:

```json
{
  "name": "Todo",
  "module": "Core",
  "naming_rule": "hash",

  "fields": [
    {
      "fieldname": "title",
      "fieldtype": "Data",
      "label": "Title",
      "reqd": true,
      "in_list_view": true
    },

    {
      "fieldname": "completed",
      "fieldtype": "Check",
      "label": "Completed",
      "default": false
    }
  ]
}
```

The framework understands:

```text
DocType
  Todo

Fields
  title
  completed

Table
  tab_todo
```

---

# 43. Creating Todo

Application code:

```ts
const todo = await resource.create("Todo", {
  title: "Learn Nodra",
  completed: false,
});
```

The resulting Document conceptually contains:

```ts
{
  doctype: "Todo",
  name: "a83c91f201",
  owner: "Administrator",
  creation: Date,
  modified: Date,
  modified_by: "Administrator",
  docstatus: 0,
  idx: 0,

  title: "Learn Nodra",
  completed: false
}
```

---

# 44. Reading Todo

```ts
const todo = await resource.get("Todo", "a83c91f201");
```

Then:

```ts
todo.get("title");
```

returns:

```text
Learn Nodra
```

---

# 45. Updating Todo

```ts
await resource.update("Todo", "a83c91f201", {
  completed: true,
});
```

The framework:

```text
load
  ↓
set completed
  ↓
validate
  ↓
beforeSave
  ↓
UPDATE
  ↓
afterSave
  ↓
onChange
```

---

# 46. Example: Microfinance Loan

This architecture works particularly well for your MFI application.

DocType:

```text
Loan
```

Metadata:

```text
member
branch
product
principal
interest_rate
term
frequency
processing_fee
insurance
```

A Document:

```text
LOAN-00001
```

contains:

```text
member = MEM-001
branch = BR-001
principal = 50000
interest_rate = 18
term = 12
frequency = MONTHLY
```

Resource:

```ts
await resource.create("Loan", {
  member: "MEM-001",
  branch: "BR-001",
  principal: 50000,
  interest_rate: 18,
});
```

Controller:

```ts
class Loan extends Document {
  async validate() {
    const principal = Number(this.get("principal"));

    if (principal <= 0) {
      throw new Error("Principal must be greater than zero");
    }
  }
}
```

This gives you:

```text
Loan DocType
      │
      ├── Metadata
      │
      ├── Database schema
      │
      ├── Validation
      │
      ├── Permissions
      │
      ├── UI metadata
      │
      └── Resource API
                │
                ▼
           Loan Document
                │
                └── Loan controller
```

---

# 47. Resource vs Document

These two are easy to confuse.

### Resource

Answers:

> "How do I access records?"

```ts
resource.get(...)
resource.list(...)
resource.create(...)
resource.update(...)
resource.delete(...)
```

### Document

Answers:

> "What is this particular record, and what can it do?"

```ts
doc.get(...)
doc.set(...)
doc.validate()
doc.beforeSave()
doc.afterSave()
doc.hasChanged(...)
```

Therefore:

```text
Resource = access boundary

Document = runtime business object
```

---

# 48. Resource vs DocType

Similarly:

### DocType

```text
What is a Loan?
```

### Resource

```text
How do I access Loans?
```

### Document

```text
What is this particular Loan?
```

Example:

```text
DocType
Loan

Resource
resource.get("Loan", "LOAN-001")

Document
Loan #LOAN-001
```

---

# 49. DocType vs Database Table

A DocType is **not merely a database table definition**.

It also contains:

```text
fields
permissions
UI hints
naming
search metadata
lifecycle metadata
document semantics
```

Therefore:

```text
DocType
   ≠
SQL table
```

The SQL table is one physical representation derived from the DocType.

---

# 50. DocType → UI

Because the DocType contains field metadata, Nodra can generate default views.

For example:

```json
{
  "fieldname": "member_name",
  "fieldtype": "Data",
  "label": "Member Name",
  "in_list_view": true
}
```

The view system can use that metadata to create:

```text
┌─────────────────────────────────────────┐
│ Member Name        Branch       Status  │
├─────────────────────────────────────────┤
│ Rahul Das          Siliguri     Active  │
│ Anil Roy           Jalpaiguri   Active  │
└─────────────────────────────────────────┘
```

The current Nodra code already separates custom views from generated default views.

---

# 51. Workflow and Document

Workflow should operate on Documents rather than directly on database rows.

Example:

```text
Loan Document
     │
     │ current state
     ▼
Pending Approval
     │
     │ Approve
     ▼
Approved
```

The workflow executor can update the document's workflow state and `docstatus`.

The Action Bar can then expose the available transitions.

Conceptually:

```text
Document
   ↓
Workflow
   ↓
available actions
   ↓
Action Bar
```

---

# 52. Resource and Permissions

Resource should not bypass permission checking.

A complete request should eventually look like:

```text
Resource
   ↓
Authentication
   ↓
Permission
   ↓
DocType validation
   ↓
Document
   ↓
ORM
   ↓
Database
```

For example:

```ts
resource.update("Loan", "LOAN-001", data);
```

should eventually ensure:

```text
User authenticated?
        ↓
Has Loan.write?
        ↓
Row accessible?
        ↓
Fields writable?
        ↓
Document valid?
        ↓
Update
```

This is particularly important for your MFI role model.

---

# 53. Recommended Responsibility Boundaries

Nodra should keep these responsibilities strict.

## DocType

Responsible for:

```text
metadata
schema
fields
permissions
naming
search configuration
UI metadata
document characteristics
```

It should NOT contain:

```text
request handling
SQL
React UI
HTTP-specific logic
```

---

## Document

Responsible for:

```text
one record
field values
change tracking
business validation
lifecycle hooks
document behavior
```

It should NOT become:

```text
global query service
HTTP controller
database connection manager
```

---

## Resource

Responsible for:

```text
application-facing data access
CRUD
request-friendly resource operations
serialization boundary
```

It should NOT contain:

```text
business validation
duplicated SQL
DocType-specific business logic
```

---

## ORM

Responsible for:

```text
persistence
database queries
CRUD execution
mapping rows ↔ Documents
```

It should NOT contain:

```text
React/UI logic
HTTP logic
application-specific business rules
```

---

# 54. Recommended Long-Term API

Your current API is already moving in a good direction.

I would target an eventual API like:

```ts
const loan = await resource.get("Loan", "LOAN-001");

loan.get("amount");

loan.set("amount", 60000);

await resource.save(loan);
```

and:

```ts
const loans = await resource.list("Loan", {
  filters: {
    branch: "BR-001",
  },

  limit: 20,
});
```

For actions:

```ts
await resource.runAction("Loan", "LOAN-001", "approve");
```

For workflow:

```ts
await resource.transition("Loan", "LOAN-001", "approve");
```

The exact API can evolve, but the conceptual separation should remain.

---

# 55. The Most Important Rule

Nodra should follow this rule:

```text
                 ┌───────────────┐
                 │    DocType    │
                 │  "What is it?"│
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   Document    │
                 │ "This record" │
                 └───────┬───────┘
                         ▲
                         │
                 ┌───────┴───────┐
                 │    Resource   │
                 │ "Access it"   │
                 └───────────────┘
```

Or even more simply:

> **DocType defines. Document behaves. Resource accesses. ORM persists.**

That should become one of the fundamental architectural principles of Nodra.

# 56. Current Nodra Status

The current `main` implementation already has substantial pieces of this architecture:

```text
DocType
   ✓ Schema
   ✓ Field metadata
   ✓ Permissions
   ✓ Naming rules
   ✓ Registry
   ✓ Database schema integration

Document
   ✓ Runtime document
   ✓ Field get/set
   ✓ Standard fields
   ✓ Dirty/change tracking
   ✓ Lifecycle hooks
   ✓ Controller inheritance support

Resource
   ✓ get
   ✓ list
   ✓ create
   ✓ update
   ✓ delete
   ✓ pagination metadata
   ✓ DocumentFactory

ORM
   ✓ insert
   ✓ getDoc
   ✓ getList
   ✓ update
   ✓ delete
   ✓ count
   ✓ getValue
   ✓ setValue
   ✓ exists

Workflow
   ✓ states
   ✓ transitions
   ✓ role checks
   ✓ available actions
   ✓ transition execution

Views
   ✓ metadata-driven defaults
   ✓ custom views
   ✓ list/form/detail/search
   ✓ view resolution
```

The important architectural gap is that **Resource, Document, Workflow, permissions, and application server functions still need to be unified into one clean execution pipeline**.

The strongest future architecture is:

```text
                       ┌──────────────┐
                       │   DocType    │
                       │   Metadata   │
                       └──────┬───────┘
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
          ▼                   ▼                    ▼
      Database             Views              Permissions
          │
          │
          ▼
      ┌──────────────┐
      │  Resource    │
      │ API Boundary │
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │  Document    │
      │ Runtime Obj. │
      └──────┬───────┘
             │
       ┌─────┼───────────────┐
       │     │               │
       ▼     ▼               ▼
    Hooks Workflow       Validation
       │     │               │
       └─────┼───────────────┘
             ▼
           ORM
             │
             ▼
         Database

```
