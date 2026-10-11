/**
 * Nodra Client API
 *
 * Client-side helper for calling Nodra server methods.
 *
 * Example:
 *
 *   const result = await callMethod("ping");
 *
 * Example with arguments:
 *
 *   const result = await callMethod("customer.get_balance", {
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
  /**
   * Custom fetch implementation.
   *
   * Useful for testing or custom environments.
   */
  fetch?: typeof globalThis.fetch;

  /**
   * Additional request headers.
   */
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
 *   const result = await callMethod("ping");
 *
 * Example with arguments:
 *
 *   const result = await callMethod("customer.get_balance", {
 *     customer: "CUST-001",
 *   });
 */
export async function callMethod<TResult = unknown>(
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

  const response = await fetcher(`/api/method/${method}`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },

    /**
     * Send authentication/session cookies.
     */
    credentials: "include",

    /**
     * Send method arguments as JSON.
     */
    body: JSON.stringify(args),
  });

  /**
   * Parse the JSON response.
   */
  const data = await response.json().catch(() => undefined);

  /**
   * Convert HTTP errors into a Nodra MethodCallError.
   */
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

  /**
   * Return the method result.
   */
  return data as TResult;
}
