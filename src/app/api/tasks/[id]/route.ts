import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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

  const task = await prisma.task.updateMany({
    where: { id, userId },
    data: { completedAt: completed ? new Date() : null },
  });

  if (task.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const deleted = await prisma.task.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

