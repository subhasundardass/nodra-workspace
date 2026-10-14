import { getNodra } from "@/server/nodra-app";
import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getRequestHeaders,
  setCookie,
} from "@tanstack/react-start/server";
import { methodErrorStatus } from "nodra/api/method";
import { MethodCallError } from "nodra/client";

type CallInput = {
  method: string;
  args: Record<string, unknown>;
};

type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export { MethodCallError };

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
  .handler(async ({ data }) => {
    const app = await getNodra();
    const headers = getRequestHeaders();
    const state = new Map<string, unknown>();
    try {
      const result = await app.methods.execute(data.method, {
        args: data.args,
        request: {
          httpMethod: "POST",
          headers: { get: (n: string) => headers.get(n) },
        },
        state,
      });
      const token = state.get("sessionToken");
      if (typeof token === "string") {
        setCookie("session_token", token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
      if (state.get("clearSessionCookie") === true)
        deleteCookie("session_token", { path: "/" });
      return { ok: true as const, data: toJsonValue(result) };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : String(e),
        status: methodErrorStatus(e),
      };
    }
  });

export async function callMethod<TResult = unknown>(
  method: string,
  args: Record<string, unknown> = {},
): Promise<TResult> {
  const result = await invokeMethod({ data: { method, args } });

  if (!result.ok) {
    throw new MethodCallError(result.error, result.status);
  }

  return result.data as TResult;
}
