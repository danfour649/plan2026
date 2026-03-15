import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createTaskForUser } from "@/lib/task-service";
import { prisma } from "@/lib/prisma";
import { addTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";

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

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { completedAt: "desc" }, { createdAt: "desc" }],
    include: {
      plan: { select: { id: true, name: true } },
      attachments: { select: { id: true, url: true, filename: true, size: true } },
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = checkRateLimit(userId);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const raw =
    body && typeof body === "object"
      ? (body as {
          title?: unknown;
          content?: unknown;
          dueAt?: unknown;
          urgency?: unknown;
          planId?: unknown;
          status?: unknown;
        })
      : {};
  const parsed = addTaskSchema.safeParse({
    title: raw.title ?? "",
    content: raw.content ?? undefined,
    dueAt: raw.dueAt ?? undefined,
    urgency: raw.urgency ?? 4,
    planId: raw.planId ?? undefined,
    status: raw.status ?? undefined,
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const result = await createTaskForUser(userId, parsed.data);
  if ("error" in result) {
    if (result.error === "Plan not found") {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ task: result.task }, { status: 201 });
}

