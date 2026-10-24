/**
 * Nodra Framework - Query Builder
 *
 * A fluent PostgreSQL query builder.
 *
 * Values are parameterized. Identifiers are validated before SQL generation.
 * This builder accepts identifiers, not arbitrary SQL expressions.
 */

import { DatabaseError } from "../core/errors";

/**
 * Supported comparison operators for WHERE clauses.
 */
export type WhereOperator =
  "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "ILIKE" | "NOT LIKE";

/** The type of SQL operation the builder will produce. */
type QueryType = "select" | "insert" | "update" | "delete" | "count";

type Connector = "AND" | "OR";

/** A single WHERE condition. */
interface WhereClause {
  column: string;
  operator: WhereOperator;
  value: unknown;
  connector: Connector;
}

/** A WHERE IN / NOT IN condition. */
interface WhereInClause {
  column: string;
  values: unknown[];
  negated: boolean;
  connector: "AND";
}

/** A WHERE IS NULL / IS NOT NULL condition. */
interface WhereNullClause {
  column: string;
  negated: boolean;
  connector: "AND";
}

/** A WHERE BETWEEN condition. */
interface WhereBetweenClause {
  column: string;
  from: unknown;
  to: unknown;
  connector: "AND";
}

type Condition =
  WhereClause | WhereInClause | WhereNullClause | WhereBetweenClause;

/** An ORDER BY directive. */
interface OrderByClause {
  column: string;
  direction: "ASC" | "DESC";
}

/** The result of build(): a parameterized SQL string and its values. */
export interface BuildResult {
  sql: string;
  params: unknown[];
}

/**
 * SQL identifier validation.
 *
 * Allows ordinary PostgreSQL identifiers and qualified names:
 *   name
 *   tab_user
 *   public.users
 *   users.email
 *
 * Does not allow SQL fragments, whitespace, comments, or quoted expressions.
 *
 * Identifiers are returned unchanged to preserve the existing SQL-generation
 * behavior and compatibility with the current database schema.
 */
function validateIdentifier(identifier: string): string {
  if (typeof identifier !== "string" || identifier.length === 0) {
    throw new DatabaseError("SQL identifier must be a non-empty string");
  }

  const parts = identifier.split(".");

  if (
    parts.some(
      (part) => part.length === 0 || !/^[a-zA-Z_][a-zA-Z0-9_$]*$/.test(part),
    )
  ) {
    throw new DatabaseError(`Invalid SQL identifier: ${identifier}`);
  }

  return identifier;
}

/**
 * Validate a column identifier, optionally allowing a wildcard.
 *
 * Accepted examples:
 *   name
 *   users.email
 *   *
 *   users.*
 */
function validateColumn(
  column: string,
  options: { allowWildcard?: boolean } = {},
): string {
  if (options.allowWildcard && column === "*") {
    return column;
  }

  if (options.allowWildcard && column.endsWith(".*")) {
    const qualifier = column.slice(0, -2);
    validateIdentifier(qualifier);
    return column;
  }

  return validateIdentifier(column);
}

function validateOperator(operator: WhereOperator): WhereOperator {
  const allowed: readonly string[] = [
    "=",
    "!=",
    ">",
    "<",
    ">=",
    "<=",
    "LIKE",
    "ILIKE",
    "NOT LIKE",
  ];

  if (typeof operator !== "string" || !allowed.includes(operator)) {
    throw new DatabaseError(`Unsupported WHERE operator: ${String(operator)}`);
  }

  return operator;
}

function validateDirection(direction: string): "ASC" | "DESC" {
  const normalized = direction.toUpperCase();

  if (normalized !== "ASC" && normalized !== "DESC") {
    throw new DatabaseError(`Invalid ORDER BY direction: ${direction}`);
  }

  return normalized;
}

function validatePagination(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new DatabaseError(`${name} must be a non-negative safe integer`);
  }

  return value;
}

/**
 * Fluent, chainable SQL query builder.
 *
 * @example
 * const { sql, params } = new QueryBuilder("tab_todo")
 *   .select("name", "title")
 *   .where("status", "=", "Open")
 *   .orderBy("creation", "desc")
 *   .limit(20)
 *   .build();
 */
export class QueryBuilder {
  private readonly table: string;

  private queryType: QueryType = "select";
  private columns: string[] = [];
  private conditions: Condition[] = [];
  private orders: OrderByClause[] = [];

  private limitValue: number | undefined;
  private offsetValue: number | undefined;

  private insertData: Record<string, unknown> | undefined;
  private updateData: Record<string, unknown> | undefined;
  private countColumn: string | undefined;

  constructor(table: string) {
    this.table = validateIdentifier(table);
  }

  // ---------------------------------------------------------------------------
  // SELECT
  // ---------------------------------------------------------------------------

  /**
   * Set the query type to SELECT and specify columns.
   * Defaults to "*" when no columns are supplied.
   *
   * Supports ordinary identifiers and qualified identifiers.
   * SQL expressions and aliases are intentionally not accepted.
   */
  select(...columns: string[]): this {
    this.queryType = "select";
    this.columns = columns.map((column) =>
      validateColumn(column, { allowWildcard: true }),
    );

    return this;
  }

  // ---------------------------------------------------------------------------
  // WHERE clauses
  // ---------------------------------------------------------------------------

  /** Add a WHERE condition joined with AND. */
  where(column: string, operator: WhereOperator, value: unknown): this {
    this.conditions.push({
      column: validateColumn(column),
      operator: validateOperator(operator),
      value,
      connector: "AND",
    });

    return this;
  }

  /** Add a WHERE condition joined with OR. */
  orWhere(column: string, operator: WhereOperator, value: unknown): this {
    this.conditions.push({
      column: validateColumn(column),
      operator: validateOperator(operator),
      value,
      connector: "OR",
    });

    return this;
  }

  /** Add a WHERE column IN (values) condition. */
  whereIn(column: string, values: unknown[]): this {
    this.conditions.push({
      column: validateColumn(column),
      values: this.validateValuesArray(values),
      negated: false,
      connector: "AND",
    });

    return this;
  }

  /** Add a WHERE column NOT IN (values) condition. */
  whereNotIn(column: string, values: unknown[]): this {
    this.conditions.push({
      column: validateColumn(column),
      values: this.validateValuesArray(values),
      negated: true,
      connector: "AND",
    });

    return this;
  }

  /** Add a WHERE column IS NULL condition. */
  whereNull(column: string): this {
    this.conditions.push({
      column: validateColumn(column),
      negated: false,
      connector: "AND",
    });

    return this;
  }

  /** Add a WHERE column IS NOT NULL condition. */
  whereNotNull(column: string): this {
    this.conditions.push({
      column: validateColumn(column),
      negated: true,
      connector: "AND",
    });

    return this;
  }

  /** Add a WHERE column BETWEEN from AND to condition. */
  whereBetween(column: string, from: unknown, to: unknown): this {
    this.conditions.push({
      column: validateColumn(column),
      from,
      to,
      connector: "AND",
    });

    return this;
  }

  // ---------------------------------------------------------------------------
  // ORDER BY
  // ---------------------------------------------------------------------------

  /** Add an ORDER BY clause. Defaults to ASC. */
  orderBy(column: string, direction: "asc" | "desc" = "asc"): this {
    this.orders.push({
      column: validateColumn(column),
      direction: validateDirection(direction),
    });

    return this;
  }

  // ---------------------------------------------------------------------------
  // LIMIT / OFFSET
  // ---------------------------------------------------------------------------

  /** Set LIMIT on the result set. */
  limit(count: number): this {
    this.limitValue = validatePagination(count, "LIMIT");
    return this;
  }

  /** Set OFFSET on the result set. */
  offset(count: number): this {
    this.offsetValue = validatePagination(count, "OFFSET");
    return this;
  }

  // ---------------------------------------------------------------------------
  // INSERT
  // ---------------------------------------------------------------------------

  /** Set the query type to INSERT with the given data. */
  insert(data: Record<string, unknown>): this {
    this.queryType = "insert";
    this.insertData = data;

    return this;
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------

  /** Set the query type to UPDATE. A WHERE clause is required. */
  update(data: Record<string, unknown>): this {
    this.queryType = "update";
    this.updateData = data;

    return this;
  }

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  /** Set the query type to DELETE. A WHERE clause is required. */
  delete(): this {
    this.queryType = "delete";

    return this;
  }

  // ---------------------------------------------------------------------------
  // COUNT
  // ---------------------------------------------------------------------------

  /** Count rows or non-null values in a column. */
  count(column?: string): this {
    this.queryType = "count";

    this.countColumn =
      column === undefined
        ? undefined
        : validateColumn(column, { allowWildcard: true });

    return this;
  }

  // ---------------------------------------------------------------------------
  // BUILD
  // ---------------------------------------------------------------------------

  /**
   * Build the final SQL query and its parameter values.
   */
  build(): BuildResult {
    switch (this.queryType) {
      case "select":
        return this.buildSelect();

      case "insert":
        return this.buildInsert();

      case "update":
        return this.buildUpdate();

      case "delete":
        return this.buildDelete();

      case "count":
        return this.buildCount();

      default: {
        const exhaustiveCheck: never = this.queryType;
        throw new DatabaseError(
          `Unsupported query type: ${String(exhaustiveCheck)}`,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private build methods
  // ---------------------------------------------------------------------------

  private buildSelect(): BuildResult {
    const params: unknown[] = [];

    const columns = this.columns.length > 0 ? this.columns.join(", ") : "*";

    let sql = `SELECT ${columns} FROM ${this.table}`;

    sql += this.buildWhereClause(params);
    sql += this.buildOrderByClause();
    sql += this.buildLimitOffset();

    return { sql, params };
  }

  private buildInsert(): BuildResult {
    if (!this.insertData) {
      throw new DatabaseError("INSERT called without data");
    }

    const keys = Object.keys(this.insertData);

    if (keys.length === 0) {
      throw new DatabaseError("INSERT data must contain at least one field");
    }

    const columns = keys.map((key) => validateColumn(key));
    const values = keys.map((key) => this.insertData![key]);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const sql =
      `INSERT INTO ${this.table} ` +
      `(${columns.join(", ")}) ` +
      `VALUES (${placeholders.join(", ")}) RETURNING *`;

    return { sql, params: values };
  }

  private buildUpdate(): BuildResult {
    if (this.conditions.length === 0) {
      throw new DatabaseError(
        "UPDATE without a WHERE clause is not allowed for safety",
      );
    }

    if (!this.updateData) {
      throw new DatabaseError("UPDATE called without data");
    }

    const keys = Object.keys(this.updateData);

    if (keys.length === 0) {
      throw new DatabaseError("UPDATE data must contain at least one field");
    }

    const params: unknown[] = [];

    const setClauses = keys.map((key) => {
      const column = validateColumn(key);

      params.push(this.updateData![key]);

      return `${column} = $${params.length}`;
    });

    let sql = `UPDATE ${this.table} SET ${setClauses.join(", ")}`;

    sql += this.buildWhereClause(params);

    return { sql, params };
  }

  private buildDelete(): BuildResult {
    if (this.conditions.length === 0) {
      throw new DatabaseError(
        "DELETE without a WHERE clause is not allowed for safety",
      );
    }

    const params: unknown[] = [];

    let sql = `DELETE FROM ${this.table}`;

    sql += this.buildWhereClause(params);

    return { sql, params };
  }

  private buildCount(): BuildResult {
    const params: unknown[] = [];

    const countExpression = this.countColumn ?? "*";

    let sql = `SELECT COUNT(${countExpression}) AS count FROM ${this.table}`;

    sql += this.buildWhereClause(params);

    return { sql, params };
  }

  // ---------------------------------------------------------------------------
  // Shared clause builders
  // ---------------------------------------------------------------------------

  private buildWhereClause(params: unknown[]): string {
    if (this.conditions.length === 0) {
      return "";
    }

    const parts: string[] = [];

    for (let index = 0; index < this.conditions.length; index++) {
      const condition = this.conditions[index]!;
      let fragment: string;

      if (this.isWhereClause(condition)) {
        params.push(condition.value);

        fragment = `${condition.column} ${condition.operator} $${params.length}`;
      } else if (this.isWhereInClause(condition)) {
        // Empty-list semantics:
        // x IN []     -> FALSE
        // x NOT IN [] -> TRUE
        if (condition.values.length === 0) {
          fragment = condition.negated ? "TRUE" : "FALSE";
        } else {
          const placeholders = condition.values.map((value) => {
            params.push(value);
            return `$${params.length}`;
          });

          const keyword = condition.negated ? "NOT IN" : "IN";

          fragment = `${condition.column} ${keyword} (${placeholders.join(", ")})`;
        }
      } else if (this.isWhereNullClause(condition)) {
        const keyword = condition.negated ? "IS NOT NULL" : "IS NULL";

        fragment = `${condition.column} ${keyword}`;
      } else {
        const betweenCondition = condition as WhereBetweenClause;

        params.push(betweenCondition.from);
        const fromIndex = params.length;

        params.push(betweenCondition.to);
        const toIndex = params.length;

        fragment = `${betweenCondition.column} BETWEEN $${fromIndex} AND $${toIndex}`;
      }

      if (index === 0) {
        parts.push(fragment);
      } else {
        parts.push(`${condition.connector} ${fragment}`);
      }
    }

    return ` WHERE ${parts.join(" ")}`;
  }

  private buildOrderByClause(): string {
    if (this.orders.length === 0) {
      return "";
    }

    const clauses = this.orders.map(
      ({ column, direction }) => `${column} ${direction}`,
    );

    return ` ORDER BY ${clauses.join(", ")}`;
  }

  private buildLimitOffset(): string {
    let sql = "";

    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------

  private validateValuesArray(values: unknown[]): unknown[] {
    if (!Array.isArray(values)) {
      throw new DatabaseError("WHERE IN values must be an array");
    }

    return values;
  }

  // ---------------------------------------------------------------------------
  // Type guards
  // ---------------------------------------------------------------------------

  private isWhereClause(condition: Condition): condition is WhereClause {
    return "operator" in condition && "value" in condition;
  }

  private isWhereInClause(condition: Condition): condition is WhereInClause {
    return "values" in condition && Array.isArray(condition.values);
  }

  private isWhereNullClause(
    condition: Condition,
  ): condition is WhereNullClause {
    return (
      !("operator" in condition) &&
      !("values" in condition) &&
      !("from" in condition) &&
      "negated" in condition
    );
  }
}
