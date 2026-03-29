import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { applyMarkTaskDone } from "@/lib/task-complete";
import { isValidTaskId } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = checkRateLimit(userId);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const { id } = await params;
  if (!isValidTaskId(id)) {
    return NextResponse.json({ error: "Invalid task ID format" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  const completed =
    body && typeof body === "object" && "completed" in body
      ? Boolean((body as { completed?: unknown }).completed)
      : null;

  if (completed === null) {
    return NextResponse.json(
      { error: "Body must include boolean `completed`" },
      { status: 400 },
    );
  }

  if (completed) {
    const { ok, recurringAdvanced } = await applyMarkTaskDone({ id, userId });
    if (!ok) {
      return NextResponse.json({ error: "Operation failed" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, recurringAdvanced });
  }

  const task = await prisma.task.updateMany({
    where: { id, userId },
    data: {
      status: "active",
      completedAt: null,
    },
  });

  if (task.count === 0) {
    return NextResponse.json({ error: "Operation failed" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = checkRateLimit(userId);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const { id } = await params;
  if (!isValidTaskId(id)) {
    return NextResponse.json({ error: "Invalid task ID format" }, { status: 400 });
  }

  const deleted = await prisma.task.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Operation failed" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

