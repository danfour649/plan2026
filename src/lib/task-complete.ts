import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { advanceTaskDueDate } from "@/lib/task-recurrence";

/**
 * Mark a task done: recurring tasks roll `dueAt` forward and stay active;
 * non-recurring tasks become completed.
 */
export async function applyMarkTaskDone(where: Prisma.TaskWhereInput): Promise<{
  ok: boolean;
  recurringAdvanced: boolean;
}> {
  const task = await prisma.task.findFirst({
    where,
    select: { id: true, recurrence: true, dueAt: true },
  });
  if (!task) return { ok: false, recurringAdvanced: false };

  if (task.recurrence) {
    const nextDue = advanceTaskDueDate(task.dueAt, task.recurrence);
    await prisma.task.update({
      where: { id: task.id },
      data: {
        dueAt: nextDue,
        status: "active",
        completedAt: null,
      },
    });
    return { ok: true, recurringAdvanced: true };
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { status: "completed", completedAt: new Date() },
  });
  return { ok: true, recurringAdvanced: false };
}
