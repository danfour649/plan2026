import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canUseAsPlanLogoContentType } from "@/lib/plan-upload-image";
import { revalidatePlanDetail, revalidatePlansCaches } from "@/lib/revalidate-app-data";
import { isValidPlanId } from "@/lib/validations/plan";
import { isValidTaskId } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: planId } = await params;
  if (!isValidPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { attachmentId?: string | null } | null;
  if (!body || !("attachmentId" in body)) {
    return NextResponse.json({ error: "Expected JSON body with attachmentId (string or null)" }, { status: 400 });
  }

  const raw = body.attachmentId;
  if (raw === null || raw === "") {
    await prisma.plan.update({
      where: { id: planId, userId },
      data: { logoAttachmentId: null },
    });
    revalidatePlansCaches(userId);
    revalidatePlanDetail(planId);
    return NextResponse.json({ ok: true, logoAttachmentId: null });
  }

  if (typeof raw !== "string" || !isValidTaskId(raw)) {
    return NextResponse.json({ error: "Invalid attachment ID" }, { status: 400 });
  }

  const attachment = await prisma.planAttachment.findFirst({
    where: { id: raw, planId },
    select: { id: true, contentType: true },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  if (!canUseAsPlanLogoContentType(attachment.contentType)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, or WebP images can be used as the plan logo." },
      { status: 400 },
    );
  }

  await prisma.plan.update({
    where: { id: planId, userId },
    data: { logoAttachmentId: attachment.id },
  });

  revalidatePlansCaches(userId);
  revalidatePlanDetail(planId);

  return NextResponse.json({ ok: true, logoAttachmentId: attachment.id });
}
