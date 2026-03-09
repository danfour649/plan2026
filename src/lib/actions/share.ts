"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type UpdateStatusByShareResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Update a task's completedAt via a public share token. No auth required; token is the auth.
 * Only allowed when the share link has allowStatusUpdate and the task belongs to the plan.
 */
export async function updateTaskStatusByShareToken(
  token: string,
  taskId: string,
  completedAt: Date | null,
): Promise<UpdateStatusByShareResult> {
  if (!token?.trim() || !taskId?.trim()) {
    return { success: false, error: "Invalid request" };
  }

  const link = await prisma.planShareLink.findUnique({
    where: { token: token.trim() },
    include: { plan: { select: { id: true } } },
  });

  if (!link) return { success: false, error: "Link not found" };
  if (link.expiresAt != null && link.expiresAt < new Date()) {
    return { success: false, error: "Link expired" };
  }
  if (!link.allowStatusUpdate) return { success: false, error: "Updates not allowed" };

  const task = await prisma.task.findFirst({
    where: { id: taskId.trim(), planId: link.plan.id },
    select: { id: true },
  });
  if (!task) return { success: false, error: "Task not found" };

  await prisma.task.update({
    where: { id: task.id },
    data: { completedAt },
  });

  revalidatePath(`/share/${token}`);
  return { success: true };
}
