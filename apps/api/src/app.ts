import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";

import { healthApp } from "@api/routes/health";
import { plansApp } from "@api/routes/plans";
import { tasksApp } from "@api/routes/tasks";

export function createApp() {
  const app = new OpenAPIHono();

  app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    scheme: "bearer",
    description: "Personal API token (`p26_…`) or NextAuth session token",
  });

  app.route("/", healthApp);
  app.route("/", tasksApp);
  app.route("/", plansApp);

  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "plan2026 API",
      version: "1.0.0",
      description:
        "Standalone HTTP API for plan2026. Authenticate with `Authorization: Bearer <token>`.",
    },
  });

  app.get("/docs", swaggerUI({ url: "/openapi.json" }));

  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}

export const app = createApp();
