import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidTaskId } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string }> };

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel serverless body limit is 4.5 MB)

export async function POST(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  if (!isValidTaskId(taskId)) {
    return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing or invalid file" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB` },
      { status: 400 },
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "File upload is not configured (missing BLOB_READ_WRITE_TOKEN)" },
      { status: 503 },
    );
  }

  const pathname = `tasks/${taskId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type || "application/octet-stream",
    token,
  });

  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId,
      userId,
      url: blob.url,
      filename: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    },
  });

  return NextResponse.json({
    id: attachment.id,
    url: attachment.url,
    filename: attachment.filename,
    size: attachment.size,
    contentType: attachment.contentType,
  });
}
