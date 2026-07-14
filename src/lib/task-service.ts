import { del } from "@vercel/blob";

import type { Task } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import type { z } from "zod";
import type { addTaskSchema, updateTaskSchema } from "@/lib/validations/task";

type AddTaskData = z.infer<typeof addTaskSchema>;
type UpdateTaskData = z.infer<typeof updateTaskSchema>;

/**
 * Single implementation for creating a task. Used by server actions and API routes.
 * Validates plan ownership when planId is set.
 */
export async function createTaskForUser(
  userId: string,
  data: AddTaskData,
): Promise<{ task: Task } | { error: string }> {
  if (data.planId) {
    const plan = await prisma.plan.findFirst({
      where: { id: data.planId, userId },
      select: { id: true },
    });
    if (!plan) return { error: "Plan not found" };
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title: data.title,
      content: data.content ?? null,
      dueAt: data.dueAt ?? null,
      recurrence: data.recurrence ?? null,
      urgency: data.urgency,
      planId: data.planId ?? null,
      status: data.status ?? "active",
    },
  });
  return { task };
}

/**
 * Single implementation for updating a task. Used by server actions and API routes.
 * Validates plan ownership when planId is set to a string.
 * `planId: null` clears the link; omit `planId` to leave it unchanged.
 */
export async function updateTaskForUser(
  userId: string,
  taskId: string,
  data: Omit<UpdateTaskData, "taskId" | "planId"> & { planId?: string | null },
): Promise<{ count: number } | { error: string }> {
  if (typeof data.planId === "string" && data.planId.length > 0) {
    const plan = await prisma.plan.findFirst({
      where: { id: data.planId, userId },
      select: { id: true },
    });
    if (!plan) return { error: "Plan not found" };
  }

  const status = data.status ?? "active";
  const current = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { status: true },
  });
  if (!current) return { count: 0 };

  const isCompleted = current.status === "completed";
  const result = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: {
      title: data.title,
      content: data.content ?? null,
      dueAt: data.dueAt ?? null,
      recurrence: data.recurrence ?? null,
      urgency: data.urgency,
      ...(data.planId !== undefined ? { planId: data.planId } : {}),
      ...(isCompleted ? {} : { status, completedAt: null }),
    },
  });
  return { count: result.count };
}

const taskDetailInclude = {
  plan: { select: { id: true, name: true } },
  attachments: { select: { id: true, url: true, filename: true, size: true } },
} as const;

/** Fetch a single task owned by `userId`. Never returns another account's task. */
export async function getTaskForUser(userId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, userId },
    include: taskDetailInclude,
  });
}

/**
 * Delete a task owned by `userId`. Uses deleteMany scoped by userId so cross-account
 * IDs cannot be deleted. Removes attachment blobs when configured.
 */
export async function deleteTaskForUser(
  userId: string,
  taskId: string,
): Promise<{ ok: true } | { error: string }> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { attachments: { select: { url: true } } },
  });
  if (!task) return { error: "Task not found" };

  if (process.env.BLOB_READ_WRITE_TOKEN && task.attachments.length > 0) {
    const urls = task.attachments.map((a) => a.url).filter(Boolean);
    if (urls.length > 0) await del(urls).catch(() => {});
  }

  const result = await prisma.task.deleteMany({
    where: { id: taskId, userId },
  });
  if (result.count === 0) return { error: "Task not found" };
  return { ok: true };
}

/**
 * Deletes every task linked to a plan (same rows that would get `planId` cleared on plan delete).
 * Removes task attachment blobs when configured. Caller must verify plan ownership.
 */
export async function deleteAllTasksForPlan(planId: string): Promise<string[]> {
  const tasks = await prisma.task.findMany({
    where: { planId },
    select: { userId: true, attachments: { select: { url: true } } },
  });
  if (tasks.length === 0) return [];

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const urls = tasks.flatMap((t) => t.attachments.map((a) => a.url)).filter(Boolean);
    if (urls.length > 0) await del(urls).catch(() => {});
  }

  await prisma.task.deleteMany({ where: { planId } });
  return [...new Set(tasks.map((t) => t.userId))];
}
