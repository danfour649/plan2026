import type { TaskRecurrence } from "@/generated/prisma/client";

/**
 * Next due instant for a recurring task. Preserves clock time when possible.
 * If `dueAt` is null, advances from `now` (same local date arithmetic as Date).
 */
export function advanceTaskDueDate(
  dueAt: Date | null,
  recurrence: TaskRecurrence,
  now: Date = new Date(),
): Date {
  const base =
    dueAt != null && !Number.isNaN(dueAt.getTime()) ? new Date(dueAt.getTime()) : new Date(now.getTime());

  switch (recurrence) {
    case "daily": {
      const d = new Date(base);
      d.setDate(d.getDate() + 1);
      return d;
    }
    case "weekly": {
      const d = new Date(base);
      d.setDate(d.getDate() + 7);
      return d;
    }
    case "monthly": {
      const d = new Date(base);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
  }
}
