/**
 * Persisted from list pages when the URL does not specify the filter (`showCompleted` / `showArchived` absent).
 * Toggles use explicit `=1` / `=0` query values so “active only” overrides a stale cookie.
 */
export const TASKS_SHOW_COMPLETED_COOKIE = "plan2026_tasks_sc";
export const PLANS_SHOW_ARCHIVED_COOKIE = "plan2026_plans_sa";

export function readTasksShowCompletedFromCookie(value: string | undefined): boolean {
  return value === "1";
}

export function readPlansShowArchivedFromCookie(value: string | undefined): boolean {
  return value === "1";
}
