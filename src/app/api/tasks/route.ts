import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addTaskSchema } from "@/lib/validations/task";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = addTaskSchema.safeParse(
    body && typeof body === "object" && "title" in body
      ? { title: (body as { title?: unknown }).title ?? "" }
      : { title: "" }
  );

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: { userId, title: parsed.data.title },
  });
  return NextResponse.json({ task }, { status: 201 });
}

