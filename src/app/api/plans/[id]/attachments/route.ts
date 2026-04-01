import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canUseAsPlanLogoContentType,
  isRasterImageContentType,
  validatePlanRasterImageDimensions,
} from "@/lib/plan-upload-image";
import { revalidatePlanDetail, revalidatePlansCaches } from "@/lib/revalidate-app-data";
import { isValidPlanId } from "@/lib/validations/plan";

type Params = { params: Promise<{ id: string }> };

async function planAccessWhere(planId: string, userId: string) {
  return prisma.plan.findFirst({
    where: {
      id: planId,
      OR: [{ userId }, { shares: { some: { sharedWithUserId: userId } } }],
    },
    select: { id: true, userId: true },
  });
}

export async function GET(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: planId } = await params;
  if (!isValidPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const plan = await planAccessWhere(planId, userId);
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const attachments = await prisma.planAttachment.findMany({
    where: { planId },
    select: { id: true, url: true, filename: true, size: true, contentType: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ attachments });
}

const MAX_FILE_SIZE = 4.2 * 1024 * 1024;

export async function POST(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: planId } = await params;
  if (!isValidPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId },
    select: { id: true, logoAttachmentId: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
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

  const contentType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (contentType.toLowerCase().startsWith("image/")) {
    if (isRasterImageContentType(contentType)) {
      const dimOk = validatePlanRasterImageDimensions(buffer);
      if (dimOk !== true) {
        return NextResponse.json({ error: dimOk }, { status: 400 });
      }
    }
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "File upload is not configured (missing BLOB_READ_WRITE_TOKEN)" },
      { status: 503 },
    );
  }

  const pathname = `plans/${planId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const blob = await put(pathname, new Blob([new Uint8Array(buffer)]), {
    access: "private",
    addRandomSuffix: false,
    contentType,
    token,
  });

  const useAsLogo =
    canUseAsPlanLogoContentType(contentType) && plan.logoAttachmentId == null;

  const attachment = await prisma.$transaction(async (tx) => {
    const row = await tx.planAttachment.create({
      data: {
        planId,
        userId,
        url: blob.url,
        filename: file.name,
        size: file.size,
        contentType,
      },
    });
    if (useAsLogo) {
      await tx.plan.update({
        where: { id: planId, userId },
        data: { logoAttachmentId: row.id },
      });
    }
    return row;
  });

  revalidatePlansCaches(userId);
  revalidatePlanDetail(planId);

  const planAfter = await prisma.plan.findFirst({
    where: { id: planId, userId },
    select: { logoAttachmentId: true },
  });

  return NextResponse.json({
    id: attachment.id,
    url: attachment.url,
    filename: attachment.filename,
    size: attachment.size,
    contentType: attachment.contentType,
    canUseAsLogo: canUseAsPlanLogoContentType(contentType),
    planLogoAttachmentId: planAfter?.logoAttachmentId ?? null,
  });
}
