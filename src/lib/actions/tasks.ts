"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { del } from "@vercel/blob";

import { getCurrentUserId } from "@/auth";
import {
  getNavCountsCacheTag,
  getPlanDetailCacheTag,
  getPlansCacheTag,
  getTasksCacheTag,
} from "@/lib/data-cache";
import { createTaskForUser, updateTaskForUser } from "@/lib/task-service";
import { prisma } from "@/lib/prisma";
import { addTaskSchema, taskIdSchema, updateTaskSchema } from "@/lib/validations/task";

export type ActionResult = { success: true } | { success: false; error: string };

/** When used with useActionState, Next/React pass (prevState, formData); we must accept both and use formData. */
export async function addTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = addTaskSchema.safeParse({
    title: formData.get("title") ?? "",
    content: formData.get("content") ?? undefined,
    dueAt: formData.get("dueAt") ?? undefined,
    urgency: formData.get("urgency") ?? 4,
    planId: formData.get("planId") ?? undefined,
    status: formData.get("status") ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false, error: msg };
  }

  // Default description to task name when adding and description is empty
  const content = parsed.data.content?.trim();
  if (!content && parsed.data.title) {
    const escaped = parsed.data.title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    parsed.data.content = `<p>${escaped}</p>`;
  }

  const result = await createTaskForUser(userId, parsed.data);
  if ("error" in result) return { success: false, error: result.error };

  revalidateTag(getTasksCacheTag(userId), "max");
  revalidateTag(getNavCountsCacheTag(userId), "max");
  if (parsed.data.planId) {
    revalidateTag(getPlansCacheTag(userId), "max");
    revalidateTag(getPlanDetailCacheTag(parsed.data.planId), "max");
    revalidatePath("/plans");
    revalidatePath(`/plans/${parsed.data.planId}`);
  }
  revalidatePath("/tasks");
  return { success: true };
}

/** When used with useActionState, Next/React pass (prevState, formData); we must accept both and use formData. */
export async function updateTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const rawPlanId = formData.get("planId");
  const planIdFromForm =
    rawPlanId === null ? undefined : rawPlanId === "" ? null : typeof rawPlanId === "string" ? rawPlanId.trim() || null : undefined;

  const parsed = updateTaskSchema.safeParse({
    taskId: formData.get("taskId") ?? "",
    title: formData.get("title") ?? "",
    content: formData.get("content") ?? undefined,
    dueAt: formData.get("dueAt") ?? undefined,
    urgency: formData.get("urgency") ?? 4,
    planId: rawPlanId === null ? undefined : rawPlanId === "" ? null : rawPlanId,
    status: formData.get("status") ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false, error: msg };
  }

  const result = await updateTaskForUser(userId, parsed.data.taskId, {
    title: parsed.data.title,
    content: parsed.data.content,
    dueAt: parsed.data.dueAt,
    urgency: parsed.data.urgency,
    planId: planIdFromForm ?? undefined,
    status: parsed.data.status,
  });
  if ("error" in result) return { success: false, error: result.error };
  if (result.count === 0) return { success: false, error: "Operation failed" };

  revalidateTag(getTasksCacheTag(userId), "max");
  // Nav counts (incomplete task count, etc.) don't change when only editing a task
  if (parsed.data.planId) {
    revalidateTag(getPlansCacheTag(userId), "max");
    revalidateTag(getPlanDetailCacheTag(parsed.data.planId), "max");
  }
  revalidatePath("/tasks");
  revalidatePath("/plans");
  if (parsed.data.planId) revalidatePath(`/plans/${parsed.data.planId}`);
  return { success: true };
}

/** When used with useActionState, Next/React pass (prevState, formData); we must accept both and use formData. */
export async function completeTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = taskIdSchema.safeParse({ taskId: formData.get("taskId") ?? "" });
  if (!parsed.success) return { success: false, error: "Invalid task" };

  const result = await prisma.task.updateMany({
    where: { id: parsed.data.taskId, userId },
    data: { status: "completed", completedAt: new Date() },
  });
  if (result.count === 0) return { success: false, error: "Operation failed" };
  revalidateTag(getTasksCacheTag(userId), "max");
  revalidateTag(getNavCountsCacheTag(userId), "max");
  const planId = formData.get("planId");
  if (typeof planId === "string" && planId.trim()) {
    revalidateTag(getPlansCacheTag(userId), "max");
    revalidateTag(getPlanDetailCacheTag(planId.trim()), "max");
    revalidatePath(`/plans/${planId.trim()}`);
  }
  revalidatePath("/tasks");
  return { success: true };
}

/** When used with useActionState, Next/React pass (prevState, formData); we must accept both and use formData. */
export async function restoreTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = taskIdSchema.safeParse({ taskId: formData.get("taskId") ?? "" });
  if (!parsed.success) return { success: false, error: "Invalid task" };

  const result = await prisma.task.updateMany({
    where: { id: parsed.data.taskId, userId },
    data: { status: "active", completedAt: null },
  });
  if (result.count === 0) return { success: false, error: "Operation failed" };
  revalidateTag(getTasksCacheTag(userId), "max");
  revalidateTag(getNavCountsCacheTag(userId), "max");
  const planId = formData.get("planId");
  if (typeof planId === "string" && planId.trim()) {
    revalidateTag(getPlansCacheTag(userId), "max");
    revalidateTag(getPlanDetailCacheTag(planId.trim()), "max");
    revalidatePath(`/plans/${planId.trim()}`);
  }
  revalidatePath("/tasks");
  return { success: true };
}

/** When used with useActionState, Next/React pass (prevState, formData); we must accept both and use formData. */
export async function deleteTask(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = taskIdSchema.safeParse({ taskId: formData.get("taskId") ?? "" });
  if (!parsed.success) return { success: false, error: "Invalid task" };

  const task = await prisma.task.findFirst({
    where: { id: parsed.data.taskId, userId },
    select: { attachments: { select: { url: true } } },
  });
  if (!task) return { success: false, error: "Operation failed" };

  if (process.env.BLOB_READ_WRITE_TOKEN && task.attachments.length > 0) {
    const urls = task.attachments.map((a) => a.url).filter(Boolean);
    if (urls.length > 0) await del(urls).catch(() => {});
  }

  const result = await prisma.task.deleteMany({
    where: { id: parsed.data.taskId, userId },
  });
  if (result.count === 0) return { success: false, error: "Operation failed" };
  revalidateTag(getTasksCacheTag(userId), "max");
  revalidateTag(getNavCountsCacheTag(userId), "max");
  const planId = formData.get("planId");
  if (typeof planId === "string" && planId.trim()) {
    revalidateTag(getPlansCacheTag(userId), "max");
    revalidateTag(getPlanDetailCacheTag(planId.trim()), "max");
    revalidatePath(`/plans/${planId.trim()}`);
  }
  revalidatePath("/tasks");
  revalidatePath("/plans");
  return { success: true };
}
