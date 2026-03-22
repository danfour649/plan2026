import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";

import { getCurrentUserId } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

/** Lightweight id+title list for the plan create/edit form (client-fetched). */
export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = checkRateLimit(userId);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") === "all" ? "all" : "incomplete";

  const tasks = await prisma.task.findMany({
    where:
      scope === "all"
        ? { userId }
        : { userId, status: { not: TaskStatus.completed } },
    orderBy:
      scope === "all"
        ? [{ urgency: "desc" as const }, { createdAt: "desc" as const }]
        : [
            { status: "asc" as const },
            { urgency: "desc" as const },
            { createdAt: "desc" as const },
          ],
    select: { id: true, title: true },
  });

  return NextResponse.json({ tasks });
}
