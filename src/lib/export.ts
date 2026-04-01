/**
 * JSON export utilities for plans and tasks.
 * Exports are intended for debugging and for AI/automation to ingest when extending the app.
 * Payload includes source and schema hints for future tooling.
 */

import type { Plan, Task, TaskStatus } from "@/generated/prisma/client";

/** Converts Date fields to ISO strings for JSON-serializable payloads. */
type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

/** Task fields we export, with dates as strings. planName and calendar fields optional (dialog export may omit them). */
export type ExportedTask = Serialized<
  Pick<
    Task,
    | "id"
    | "title"
    | "content"
    | "dueAt"
    | "urgency"
    | "status"
    | "completedAt"
    | "planId"
    | "createdAt"
    | "updatedAt"
    | "recurrence"
  >
> & {
  planName?: string | null;
  googleCalendarEventId?: string | null;
  googleCalendarEventUrl?: string | null;
};

/** Subset of Task for plan-in-plan export (no planId / calendar fields). */
export type ExportedPlanTask = Serialized<
  Pick<
    Task,
    | "id"
    | "title"
    | "content"
    | "dueAt"
    | "urgency"
    | "status"
    | "completedAt"
    | "createdAt"
    | "updatedAt"
    | "recurrence"
  >
>;

/** Plan fields we export, with dates as strings. tasks or taskSummaries added depending on context. */
export type ExportedPlan = Serialized<
  Pick<
    Plan,
    | "id"
    | "name"
    | "description"
    | "goal"
    | "startAt"
    | "endAt"
    | "actualStartAt"
    | "actualEndAt"
    | "status"
    | "priority"
    | "percentCompleted"
    | "notes"
    | "color"
    | "imageUrl"
    | "logoAttachmentId"
    | "createdAt"
    | "updatedAt"
  >
> & {
  tasks?: ExportedPlanTask[];
  /** When plan is from list view, only id and status per task. */
  taskSummaries?: { id: string; status: string }[];
  totalTaskCount?: number;
  completedTaskCount?: number;
};

export type ExportType = "tasks" | "plans" | "task" | "plan";

export type ExportPayload =
  | { exportedAt: string; source: string; exportType: "tasks"; data: { tasks: ExportedTask[] } }
  | { exportedAt: string; source: string; exportType: "plans"; data: { plans: ExportedPlan[] } }
  | { exportedAt: string; source: string; exportType: "task"; data: { task: ExportedTask } }
  | { exportedAt: string; source: string; exportType: "plan"; data: { plan: ExportedPlan } };

const SOURCE = "plan2026";

export function buildTasksExportPayload(tasks: ExportedTask[]): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    source: SOURCE,
    exportType: "tasks",
    data: { tasks },
  };
}

export function buildPlansExportPayload(plans: ExportedPlan[]): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    source: SOURCE,
    exportType: "plans",
    data: { plans },
  };
}

export function buildTaskExportPayload(task: ExportedTask): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    source: SOURCE,
    exportType: "task",
    data: { task },
  };
}

/** Clipboard / export row for a task shown on the plan detail page (calendar fields omitted). */
export function planDetailTaskToExportedTask(
  task: {
    id: string;
    title: string;
    content: string | null;
    dueAt: Date | null;
    urgency: number;
    status: TaskStatus;
    completedAt: Date | null;
    recurrence: ExportedTask["recurrence"];
    createdAt: Date;
    updatedAt: Date;
  },
  planId: string,
  planName: string,
): ExportedTask {
  return {
    id: task.id,
    title: task.title,
    content: task.content,
    dueAt: task.dueAt?.toISOString() ?? null,
    urgency: task.urgency,
    status: task.status,
    completedAt: task.completedAt?.toISOString() ?? null,
    recurrence: task.recurrence ?? null,
    planId,
    planName,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    googleCalendarEventId: null,
    googleCalendarEventUrl: null,
  };
}

export function buildPlanExportPayload(plan: ExportedPlan): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    source: SOURCE,
    exportType: "plan",
    data: { plan },
  };
}

/**
 * Trigger a client-side download of the payload as a JSON file.
 * Call only from the browser (e.g. from a button click).
 */
export function downloadExport(filename: string, payload: ExportPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
