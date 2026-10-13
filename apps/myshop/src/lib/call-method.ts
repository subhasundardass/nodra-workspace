import { getRequestHeaders } from "@tanstack/react-start/server";
import { nodraCallMethod } from "nodra/client";

export { MethodCallError } from "nodra/client";

export async function callMethod<TResult = unknown>(
  method: string,
  args: Record<string, unknown> = {},
): Promise<TResult> {
  const cookie = getRequestHeaders().get("cookie");

  return nodraCallMethod<TResult>(method, args, {
    headers: cookie ? { cookie } : {},
  });
}
