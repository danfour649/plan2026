import { del } from "@vercel/blob";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { deleteAllTasksForPlan } from "@/lib/task-service";
import { TASK_TITLE_MAX_LENGTH } from "@/lib/validations/task";
import type { CreatePlanInput, UpdatePlanInput } from "@/lib/validations/plan";

const planDetailInclude = {
  tasks: { select: { id: true, status: true, completedAt: true } },
} as const;

export type PlanAccess = "owner" | "shared";

/**
 * Access check for a plan: owner or sharee. Returns null if the account has no access
 * (does not distinguish missing vs other-user — callers treat as not found).
 */
export async function getPlanAccessForUser(
  userId: string,
  planId: string,
): Promise<PlanAccess | null> {
  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
      OR: [{ userId }, { shares: { some: { sharedWithUserId: userId } } }],
    },
    select: { userId: true },
  });
  if (!plan) return null;
  return plan.userId === userId ? "owner" : "shared";
}

/** Readable by owner or sharee. */
export async function getPlanForUser(userId: string, planId: string) {
  return prisma.plan.findFirst({
    where: {
      id: planId,
      OR: [{ userId }, { shares: { some: { sharedWithUserId: userId } } }],
    },
    include: planDetailInclude,
  });
}

export async function createPlanForUser(
  userId: string,
  data: CreatePlanInput,
): Promise<{ plan: Awaited<ReturnType<typeof getPlanForUser>> } | { error: string }> {
  const { taskIds, newTasks, ...planData } = data;

  const created = await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
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

    if (newTasks.length > 0) {
      await tx.task.createMany({
        data: newTasks.map((row) => ({
          userId,
          title: row.title.slice(0, TASK_TITLE_MAX_LENGTH),
          content: row.content ?? null,
          dueAt: row.dueAt ?? null,
          urgency: row.urgency,
          planId: plan.id,
        })),
      });
    }

    if (taskIds.length > 0) {
      // Only attach tasks owned by this user — never another account's tasks.
      await tx.task.updateMany({
        where: { id: { in: taskIds }, userId },
        data: { planId: plan.id },
      });
    }

    return plan;
  });

  const plan = await getPlanForUser(userId, created.id);
  return { plan };
}

export async function updatePlanForUser(
  userId: string,
  data: UpdatePlanInput,
): Promise<{ plan: NonNullable<Awaited<ReturnType<typeof getPlanForUser>>> } | { error: string }> {
  const { planId, taskIds, newTasks, ...planData } = data;

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Owner-only: sharees cannot mutate.
    const updateResult = await tx.plan.updateMany({
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

    if (updateResult.count === 0) return { count: 0 as const };

    const desiredIds = new Set<string>(taskIds);

    await tx.task.updateMany({
      where: { userId, planId },
      data: { planId: null },
    });

    if (desiredIds.size > 0) {
      await tx.task.updateMany({
        where: { id: { in: [...desiredIds] }, userId },
        data: { planId },
      });
    }

    if (newTasks.length > 0) {
      await tx.task.createMany({
        data: newTasks.map((row) => ({
          userId,
          title: row.title.slice(0, TASK_TITLE_MAX_LENGTH),
          content: row.content ?? null,
          dueAt: row.dueAt ?? null,
          urgency: row.urgency,
          planId,
        })),
      });
    }

    return { count: updateResult.count };
  });

  if (result.count === 0) return { error: "Plan not found" };

  const plan = await getPlanForUser(userId, planId);
  if (!plan) return { error: "Plan not found" };
  return { plan };
}

export async function deletePlanForUser(
  userId: string,
  planId: string,
  options: { deleteAssociatedTasks: boolean },
): Promise<{ ok: true } | { error: string }> {
  const planWithAttachments = await prisma.plan.findFirst({
    where: { id: planId, userId },
    select: { attachments: { select: { url: true } } },
  });
  if (!planWithAttachments) return { error: "Plan not found" };

  if (process.env.BLOB_READ_WRITE_TOKEN && planWithAttachments.attachments.length > 0) {
    const urls = planWithAttachments.attachments.map((a) => a.url).filter(Boolean);
    if (urls.length > 0) await del(urls).catch(() => {});
  }

  if (options.deleteAssociatedTasks) {
    await deleteAllTasksForPlan(planId);
  }

  const result = await prisma.plan.deleteMany({
    where: { id: planId, userId },
  });
  if (result.count === 0) return { error: "Plan not found" };
  return { ok: true };
}
