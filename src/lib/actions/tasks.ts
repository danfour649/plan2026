"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";

import { getCurrentUserId } from "@/auth";
import {
  revalidateNavCounts,
  revalidatePlanDetail,
  revalidatePlansCaches,
  revalidateTasksCaches,
} from "@/lib/revalidate-app-data";
import { createTaskForUser, updateTaskForUser } from "@/lib/task-service";
import { applyMarkTaskDone } from "@/lib/task-complete";
import { prisma } from "@/lib/prisma";
import { addTaskSchema, taskIdSchema, updateTaskSchema } from "@/lib/validations/task";

export type ActionResult =
  | { success: true; recurringAdvanced?: boolean }
  | { success: false; error: string };

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
    recurrence: formData.get("recurrence") ?? undefined,
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

  revalidateTasksCaches(userId);
  revalidateNavCounts(userId);
  revalidatePath("/tasks");
  if (parsed.data.planId) {
    revalidatePlansCaches(userId);
    revalidatePlanDetail(parsed.data.planId);
    revalidatePath(`/plans/${parsed.data.planId}`);
  }
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
    recurrence: formData.get("recurrence") ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Invalid input";
    return { success: false, error: msg };
  }

  const result = await updateTaskForUser(userId, parsed.data.taskId, {
    title: parsed.data.title,
    content: parsed.data.content,
    dueAt: parsed.data.dueAt,
    recurrence: parsed.data.recurrence,
    urgency: parsed.data.urgency,
    planId: planIdFromForm ?? undefined,
    status: parsed.data.status,
  });
  if ("error" in result) return { success: false, error: result.error };
  if (result.count === 0) return { success: false, error: "Operation failed" };

  revalidateTasksCaches(userId);
  revalidatePath("/tasks");
  if (parsed.data.planId) {
    revalidatePlansCaches(userId);
    revalidatePlanDetail(parsed.data.planId);
    revalidatePath(`/plans/${parsed.data.planId}`);
  }
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

  const { ok, recurringAdvanced } = await applyMarkTaskDone({
    id: parsed.data.taskId,
    userId,
  });
  if (!ok) return { success: false, error: "Operation failed" };
  revalidateTasksCaches(userId);
  revalidateNavCounts(userId);
  revalidatePath("/tasks");
  const planId = formData.get("planId");
  if (typeof planId === "string" && planId.trim()) {
    revalidatePlansCaches(userId);
    revalidatePlanDetail(planId.trim());
    revalidatePath(`/plans/${planId.trim()}`);
  }
  return { success: true, recurringAdvanced };
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
  revalidateTasksCaches(userId);
  revalidateNavCounts(userId);
  revalidatePath("/tasks");
  const planId = formData.get("planId");
  if (typeof planId === "string" && planId.trim()) {
    revalidatePlansCaches(userId);
    revalidatePlanDetail(planId.trim());
    revalidatePath(`/plans/${planId.trim()}`);
  }
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
  revalidateTasksCaches(userId);
  revalidateNavCounts(userId);
  revalidatePath("/tasks");
  const planId = formData.get("planId");
  if (typeof planId === "string" && planId.trim()) {
    revalidatePlansCaches(userId);
    revalidatePlanDetail(planId.trim());
    revalidatePath(`/plans/${planId.trim()}`);
  }
  return { success: true };
}
