import { createFileRoute } from "@tanstack/react-router";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { methodErrorStatus } from "nodra/api/method";
import { getNodra } from "@/server/nodra-app";

export const Route = createFileRoute("/api/method/$methodPath")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const state = new Map<string, unknown>();

        try {
          const app = await getNodra();

          const body = await request.json().catch(() => ({}));
          const headers = request.headers;

          const result = await app.methods.execute(params.methodPath, {
            args: body,
            request: {
              httpMethod: request.method,
              headers: {
                get(name: string) {
                  return headers.get(name);
                },
              },
            },
            state,
          });

          // console.log("[request cookie trace]", {
          //   method: params.methodPath,
          //   hasCookieHeader: request.headers.has("cookie"),
          //   hasSessionCookie: Boolean(
          //     request.headers
          //       .get("cookie")
          //       ?.split(";")
          //       .some((part) => part.trim().startsWith("session_token=")),
          //   ),
          // });

          const response = Response.json(result);

          // auth.login stores the new session token in method state.
          const sessionToken = state.get("sessionToken");
          const clearSessionCookie = state.get("clearSessionCookie");

          if (typeof sessionToken === "string") {
            response.headers.append(
              "Set-Cookie",
              [
                `session_token=${encodeURIComponent(sessionToken)}`,
                "Path=/",
                "HttpOnly",
                "SameSite=Lax",
              ].join("; "),
            );
          }

          if (clearSessionCookie === true) {
            response.headers.append(
              "Set-Cookie",
              "session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
            );
          }

          return response;
        } catch (error) {
          console.error("Method execution failed:", error);

          return Response.json(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            {
              status: methodErrorStatus(error),
            },
          );
        }
      },
    },
  },
});
