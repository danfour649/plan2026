import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const app = new OpenAPIHono();

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Meta"],
  summary: "Health check",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            ok: z.boolean(),
            service: z.string(),
          }),
        },
      },
      description: "Service is running",
    },
  },
});

app.openapi(healthRoute, (c) => c.json({ ok: true, service: "plan2026-api" }, 200));

export { app as healthApp };
