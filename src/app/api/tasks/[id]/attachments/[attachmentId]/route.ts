import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidTaskId } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId, attachmentId } = await params;
  if (!isValidTaskId(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const deleted = await prisma.taskAttachment.deleteMany({
    where: {
      id: attachmentId,
      taskId,
      userId,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
