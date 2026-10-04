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
          const headers = getRequestHeaders();

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

          const response = Response.json(result);

          // auth.login stores the new session token in method state.
          const sessionToken = state.get("sessionToken");

          if (typeof sessionToken === "string") {
            response.headers.set(
              "Set-Cookie",
              [
                `session_token=${encodeURIComponent(sessionToken)}`,
                "Path=/",
                "HttpOnly",
                "SameSite=Lax",
              ].join("; "),
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
