/**
 * Nodra Client API
 *
 * Client-side helper for calling Nodra server methods.
 *
 * Example:
 *
 *   const result = await nodraCallMethod("ping");
 *
 * Example with arguments:
 *
 *   const result = await nodraCallMethod("customer.get_balance", {
 *     customer: "CUST-001",
 *   });
 */

/**
 * Error thrown when a server method call fails.
 */
export class MethodCallError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown = undefined) {
    super(message);

    this.name = "MethodCallError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Options for calling a server method.
 */
export interface CallMethodOptions {
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
}

/**
 * Call a Nodra server method.
 *
 * The method is sent to:
 *
 *   POST /api/method/{method}
 *
 * Example:
 *
 *   const result = await nodraCallMethod("ping");
 *
 * Example with arguments:
 *
 *   const result = await nodraCallMethod("customer.get_balance", {
 *     customer: "CUST-001",
 *   });
 */

export async function nodraCallMethod<TResult = unknown>(
  method: string,
  args: Record<string, unknown> = {},
  options: CallMethodOptions = {},
): Promise<TResult> {
  if (!method || method.trim().length === 0) {
    throw new Error("Method path is required");
  }

  const fetcher = options.fetch ?? globalThis.fetch;

  if (!fetcher) {
    throw new Error("Fetch is not available in this environment");
  }

  const isServer = typeof process !== "undefined" && !!process.versions?.node;

  const url = isServer
    ? new URL(
        `/api/method/${method}`,
        process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
      ).toString()
    : `/api/method/${method}`;

  const response = await fetcher(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...(isServer ? {} : { credentials: "include" as const }),
    body: JSON.stringify(args),
  });

  const data = await response.json().catch(() => undefined);

  if (!response.ok) {
    let message = `Method call failed with status ${response.status}`;

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      message = data.error;
    }

    throw new MethodCallError(message, response.status, data);
  }

  return data as TResult;
}
