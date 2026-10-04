import { createFileRoute } from "@tanstack/react-router";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { getNodra } from "@/server/nodra-app";

export const Route = createFileRoute("/api/method/$methodPath")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
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
          });

          return Response.json(result);
        } catch (error) {
          console.error("Method execution failed:", error);

          return Response.json(
            {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
