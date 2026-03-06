"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addTaskSchema, taskIdSchema } from "@/lib/validations/task";

export type ActionResult = { success: true } | { success: false; error: string };

export async function addTask(formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = addTaskSchema.safeParse({
    title: formData.get("title") ?? "",
    content: formData.get("content") ?? undefined,
    dueAt: formData.get("dueAt") ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false, error: msg };
  }

  await prisma.task.create({
    data: {
      userId,
      title: parsed.data.title,
      content: parsed.data.content ?? null,
      dueAt: parsed.data.dueAt ?? null,
    },
  });
  revalidatePath("/tasks");
  return { success: true };
}

export async function completeTask(formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = taskIdSchema.safeParse({ taskId: formData.get("taskId") ?? "" });
  if (!parsed.success) return { success: false, error: "Invalid task" };

  await prisma.task.updateMany({
    where: { id: parsed.data.taskId, userId },
    data: { completedAt: new Date() },
  });
  revalidatePath("/tasks");
  return { success: true };
}

export async function restoreTask(formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = taskIdSchema.safeParse({ taskId: formData.get("taskId") ?? "" });
  if (!parsed.success) return { success: false, error: "Invalid task" };

  await prisma.task.updateMany({
    where: { id: parsed.data.taskId, userId },
    data: { completedAt: null },
  });
  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTask(formData: FormData): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = taskIdSchema.safeParse({ taskId: formData.get("taskId") ?? "" });
  if (!parsed.success) return { success: false, error: "Invalid task" };

  await prisma.task.deleteMany({
    where: { id: parsed.data.taskId, userId },
  });
  revalidatePath("/tasks");
  return { success: true };
}
