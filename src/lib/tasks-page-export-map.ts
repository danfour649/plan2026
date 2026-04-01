import type { CachedTasksPageTask } from "@/lib/data-cache";
import type { ExportedTask } from "@/lib/export";

function coerceDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

/** Single task row for JSON export / copy (dates as ISO strings). */
export function cachedTasksPageTaskToExportedTask(task: CachedTasksPageTask): ExportedTask {
  return {
    id: task.id,
    title: task.title,
    content: task.content,
    dueAt: task.dueAt != null ? coerceDate(task.dueAt).toISOString() : null,
    urgency: task.urgency,
    status: task.status,
    completedAt: task.completedAt != null ? coerceDate(task.completedAt).toISOString() : null,
    recurrence: task.recurrence ?? null,
    planId: task.planId,
    planName: task.plan?.name ?? null,
    createdAt: coerceDate(task.createdAt).toISOString(),
    updatedAt: coerceDate(task.updatedAt).toISOString(),
    googleCalendarEventId: task.googleCalendarEventId,
    googleCalendarEventUrl: task.googleCalendarEventUrl,
  };
}

/** Maps tasks list page slices to JSON export rows (dates as ISO strings). */
export function tasksPageSlicesToExportedTasks(
  remaining: CachedTasksPageTask[],
  completed: CachedTasksPageTask[],
): ExportedTask[] {
  return [...remaining.map(cachedTasksPageTaskToExportedTask), ...completed.map(cachedTasksPageTaskToExportedTask)];
}
