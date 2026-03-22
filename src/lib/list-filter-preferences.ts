/** Persisted when `showCompleted` / `showArchived` is not set on the URL (see tasks & plans list pages). */
export const TASKS_SHOW_COMPLETED_COOKIE = "plan2026_tasks_sc";
export const PLANS_SHOW_ARCHIVED_COOKIE = "plan2026_plans_sa";

export function readTasksShowCompletedFromCookie(value: string | undefined): boolean {
  return value === "1";
}

export function readPlansShowArchivedFromCookie(value: string | undefined): boolean {
  return value === "1";
}
