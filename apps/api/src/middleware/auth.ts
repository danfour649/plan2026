import type { Context, Next } from "hono";

import { resolveUserIdFromAuthorization } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export type ApiAuthVariables = {
  userId: string;
};

export async function requireBearerAuth(c: Context, next: Next) {
  const userId = await resolveUserIdFromAuthorization(c.req.header("Authorization"));
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const limited = checkRateLimit(userId);
  if (limited) {
    c.header("Retry-After", String(limited.retryAfterSeconds));
    return c.json({ error: "Too many requests" }, 429);
  }

  c.set("userId", userId);
  await next();
}
