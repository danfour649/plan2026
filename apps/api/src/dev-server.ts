import "@api/load-env";

import { serve } from "@hono/node-server";

import { app } from "@api/app";

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`plan2026 API listening on http://localhost:${info.port}`);
  console.log(`OpenAPI: http://localhost:${info.port}/openapi.json`);
  console.log(`Docs:    http://localhost:${info.port}/docs`);
});
