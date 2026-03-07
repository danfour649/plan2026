"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPlanSchema, planIdSchema, updatePlanSchema } from "@/lib/validations/plan";
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
