/**
 * JSON export utilities for plans and tasks.
 * Exports are intended for debugging and for AI/automation to ingest when extending the app.
 * Payload includes source and schema hints for future tooling.
 */

export type ExportedTask = {
  id: string;
  title: string;
  content: string | null;
  dueAt: string | null;
  urgency: number;
  completedAt: string | null;
  planId: string | null;
  planName?: string | null;
  createdAt: string;
  updatedAt?: string;
  googleCalendarEventId?: string | null;
  googleCalendarEventUrl?: string | null;
};

export type ExportedPlanTask = {
  id: string;
  title: string;
  content: string | null;
  dueAt: string | null;
  urgency: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type ExportedPlan = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  startAt: string;
  endAt: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  status: string;
  priority: number;
  percentCompleted: number;
  notes: string | null;
  color: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  tasks?: ExportedPlanTask[];
  /** When plan is from list view, only id and completedAt per task. */
  taskSummaries?: { id: string; completedAt: string | null }[];
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
