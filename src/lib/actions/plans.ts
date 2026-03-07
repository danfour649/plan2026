"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createPlanSchema,
  planIdSchema,
  PLAN_STATUS_VALUES,
  updatePlanSchema,
  type PlanStatus,
} from "@/lib/validations/plan";
import { TASK_TITLE_MAX_LENGTH } from "@/lib/validations/task";

export type PlanActionResult = { success: true } | { success: false; error: string };

function buildPlanPayload(formData: FormData, isUpdate: boolean) {
  const taskIds = formData.getAll("taskIds").filter((v): v is string => typeof v === "string");
  const newTaskTitles = formData
    .getAll("newTaskTitle")
    .filter((v): v is string => typeof v === "string" && v.trim() !== "");
  const raw: Record<string, unknown> = {
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? undefined,
    goal: formData.get("goal") ?? undefined,
    startAt: formData.get("startAt") ?? undefined,
    endAt: formData.get("endAt") ?? undefined,
    actualStartAt: formData.get("actualStartAt") ?? undefined,
    actualEndAt: formData.get("actualEndAt") ?? undefined,
    priority: formData.get("priority") ?? 4,
    percentCompleted: formData.get("percentCompleted") ?? 0,
    notes: formData.get("notes") ?? undefined,
    color: formData.get("color") ?? undefined,
    imageUrl: formData.get("imageUrl") ?? undefined,
    taskIds,
    newTaskTitles,
  };
  if (isUpdate) {
    raw.planId = formData.get("planId") ?? "";
    raw.status = formData.get("status") ?? "draft";
  }
  return raw;
}

export async function createPlan(formData: FormData): Promise<PlanActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = createPlanSchema.safeParse(buildPlanPayload(formData, false));
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false, error: msg };
  }

  const { taskIds, newTaskTitles, ...planData } = parsed.data;

  const plan = await prisma.plan.create({
    data: {
      userId,
      name: planData.name,
      description: planData.description ?? null,
      goal: planData.goal ?? null,
      startAt: planData.startAt,
      endAt: planData.endAt,
      actualStartAt: planData.actualStartAt ?? null,
      actualEndAt: planData.actualEndAt ?? null,
      status: "draft",
      priority: planData.priority,
      percentCompleted: planData.percentCompleted,
      notes: planData.notes ?? null,
      color: planData.color ?? null,
      imageUrl: planData.imageUrl ?? null,
    },
  });

  const allTaskIds = [...taskIds];
  for (const title of newTaskTitles) {
    const t = await prisma.task.create({
      data: {
        userId,
        title: title.slice(0, TASK_TITLE_MAX_LENGTH),
        urgency: 4,
        planId: plan.id,
      },
    });
    allTaskIds.push(t.id);
  }

  if (allTaskIds.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: allTaskIds }, userId },
      data: { planId: plan.id },
    });
  }

  revalidatePath("/plans");
  revalidatePath("/tasks");
  redirect(`/plans/${plan.id}`);
}

export async function updatePlan(formData: FormData): Promise<PlanActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = updatePlanSchema.safeParse(buildPlanPayload(formData, true));
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false, error: msg };
  }

  const { planId, taskIds, newTaskTitles, ...planData } = parsed.data;

  const result = await prisma.plan.updateMany({
    where: { id: planId, userId },
    data: {
      name: planData.name,
      description: planData.description ?? null,
      goal: planData.goal ?? null,
      startAt: planData.startAt,
      endAt: planData.endAt,
      actualStartAt: planData.actualStartAt ?? null,
      actualEndAt: planData.actualEndAt ?? null,
      status: planData.status,
      priority: planData.priority,
      percentCompleted: planData.percentCompleted,
      notes: planData.notes ?? null,
      color: planData.color ?? null,
      imageUrl: planData.imageUrl ?? null,
    },
  });

  if (result.count === 0) return { success: false, error: "Plan not found" };

  const desiredIds = new Set<string>(taskIds);

  await prisma.task.updateMany({
    where: { userId, planId },
    data: { planId: null },
  });

  if (desiredIds.size > 0) {
    await prisma.task.updateMany({
      where: { id: { in: [...desiredIds] as string[] }, userId },
      data: { planId },
    });
  }

  for (const title of newTaskTitles) {
    await prisma.task.create({
      data: {
        userId,
        title: title.slice(0, TASK_TITLE_MAX_LENGTH),
        urgency: 4,
        planId,
      },
    });
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/tasks");
  redirect("/plans");
}

/** Updates only plan status. Use from list view for quick status change. */
export async function updatePlanStatus(formData: FormData): Promise<PlanActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const planId = formData.get("planId");
  const status = formData.get("status");
  if (typeof planId !== "string" || !planId || typeof status !== "string" || !status) {
    return { success: false, error: "Missing plan or status" };
  }
  if (!(PLAN_STATUS_VALUES as readonly string[]).includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  const result = await prisma.plan.updateMany({
    where: { id: planId, userId },
    data: { status: status as PlanStatus },
  });

  if (result.count === 0) return { success: false, error: "Plan not found" };

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  revalidatePath("/tasks");
  return { success: true };
}

/** Server action for form action use. Returns void; throws on error so it can be passed directly to <form action>. */
export async function deletePlan(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Unauthorized");

  const parsed = planIdSchema.safeParse({ planId: formData.get("planId") ?? "" });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors[0] ?? "Invalid plan");

  const result = await prisma.plan.deleteMany({
    where: { id: parsed.data.planId, userId },
  });

  if (result.count === 0) throw new Error("Plan not found");

  revalidatePath("/plans");
  revalidatePath("/tasks");
  redirect("/plans");
}

export type SharePlanResult = { success: true } | { success: false; error: string };

export async function sharePlanByEmail(planId: string, email: string): Promise<SharePlanResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = planIdSchema.safeParse({ planId });
  if (!parsed.success) return { success: false, error: "Invalid plan" };

  const plan = await prisma.plan.findFirst({
    where: { id: parsed.data.planId, userId },
    select: { id: true },
  });
  if (!plan) return { success: false, error: "Plan not found" };

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { success: false, error: "Email is required" };

  const sharedWithUser = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (!sharedWithUser) return { success: false, error: "No user found with that email" };
  if (sharedWithUser.id === userId) return { success: false, error: "You cannot share a plan with yourself" };

  try {
    await prisma.planShare.create({
      data: {
        planId: plan.id,
        sharedWithUserId: sharedWithUser.id,
      },
    });
  } catch (e) {
    const isUniqueViolation =
      e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002";
    if (isUniqueViolation) return { success: false, error: "Plan is already shared with that user" };
    throw e;
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${plan.id}`);
  return { success: true };
}

const INVITE_EXPIRY_DAYS = 7;

export type CreateInviteResult =
  | { success: true; inviteUrl: string }
  | { success: false; error: string };

export async function createPlanInvite(planId: string): Promise<CreateInviteResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = planIdSchema.safeParse({ planId });
  if (!parsed.success) return { success: false, error: "Invalid plan" };

  const plan = await prisma.plan.findFirst({
    where: { id: parsed.data.planId, userId },
    select: { id: true },
  });
  if (!plan) return { success: false, error: "Plan not found" };

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  await prisma.planInvite.create({
    data: {
      planId: plan.id,
      token,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://plan2026-pi.vercel.app";
  const inviteUrl = `${baseUrl}/invite/${token}`;
  revalidatePath(`/plans/${plan.id}`);
  return { success: true, inviteUrl };
}
