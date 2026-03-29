"use server";

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
 * Validates plan ownership when planId is set.
 */
export async function updateTaskForUser(
  userId: string,
  taskId: string,
  data: Omit<UpdateTaskData, "taskId">,
): Promise<{ count: number } | { error: string }> {
  if (data.planId) {
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
  const isCompleted = current?.status === "completed";
  const result = await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: {
      title: data.title,
      content: data.content ?? null,
      dueAt: data.dueAt ?? null,
      recurrence: data.recurrence ?? null,
      urgency: data.urgency,
      planId: data.planId ?? null,
      ...(isCompleted
        ? {}
        : { status, completedAt: null }),
    },
  });
  return { count: result.count };
}
