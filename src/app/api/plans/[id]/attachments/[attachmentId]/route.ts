import { NextResponse } from "next/server";
import { del, get } from "@vercel/blob";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePlanDetail, revalidatePlansCaches } from "@/lib/revalidate-app-data";
import { isValidPlanId } from "@/lib/validations/plan";
import { isValidTaskId } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string; attachmentId: string }> };

function pathnameFromBlobUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    return path.startsWith("/") ? path.slice(1) : path;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: planId, attachmentId } = await params;
  if (!isValidPlanId(planId) || !isValidTaskId(attachmentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
      OR: [{ userId }, { shares: { some: { sharedWithUserId: userId } } }],
    },
    select: { id: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const attachment = await prisma.planAttachment.findFirst({
    where: { id: attachmentId, planId },
    select: { url: true, filename: true, contentType: true },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File download is not configured (missing BLOB_READ_WRITE_TOKEN)" },
      { status: 503 },
    );
  }

  const pathname = pathnameFromBlobUrl(attachment.url);
  if (!pathname) {
    return NextResponse.json({ error: "Invalid attachment URL" }, { status: 400 });
  }

  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": attachment.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${attachment.filename.replace(/"/g, '\\"')}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache",
    },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: planId, attachmentId } = await params;
  if (!isValidPlanId(planId) || !isValidTaskId(attachmentId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const attachment = await prisma.planAttachment.findFirst({
    where: { id: attachmentId, planId, userId },
    select: { url: true },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  await prisma.plan.updateMany({
    where: { id: planId, userId, logoAttachmentId: attachmentId },
    data: { logoAttachmentId: null },
  });

  if (process.env.BLOB_READ_WRITE_TOKEN && attachment.url) {
    await del(attachment.url).catch(() => {});
  }

  await prisma.planAttachment.deleteMany({
    where: { id: attachmentId, planId, userId },
  });

  revalidatePlansCaches(userId);
  revalidatePlanDetail(planId);

  return NextResponse.json({ ok: true });
}
