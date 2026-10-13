import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { MethodCallError, nodraCallMethod } from "nodra/client";

type CallInput = {
  method: string;
  args: Record<string, unknown>;
};

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }

  if (typeof value === "object") {
    const result: Record<string, JsonValue> = {};

    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) {
        result[key] = toJsonValue(item);
      }
    }

    return result;
  }

  return null;
}

const invokeMethod = createServerFn({ method: "POST" })
  .validator((input: CallInput) => input)
  .handler(async ({ data }): Promise<JsonValue> => {
    const cookie = getRequestHeaders().get("cookie");

    const result = await nodraCallMethod<unknown>(data.method, data.args, {
      headers: cookie ? { cookie } : {},
    });

    return toJsonValue(result);
  });

export { MethodCallError };

export async function callMethod<TResult = unknown>(
  method: string,
  args: Record<string, unknown> = {},
): Promise<TResult> {
  const result = await invokeMethod({ data: { method, args } });
  return result as TResult;
}
