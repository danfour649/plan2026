import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { fetchNavCountsDirect } from "@/lib/data-cache";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = checkRateLimit(userId);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const counts = await fetchNavCountsDirect(userId);
  return NextResponse.json(counts, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}
