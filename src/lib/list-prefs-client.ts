import {
  PLANS_SHOW_ARCHIVED_COOKIE,
  readListPrefCookieRawFromDocument,
  readPlansShowArchivedFromCookie,
  readTasksShowCompletedFromCookie,
  TASKS_SHOW_COMPLETED_COOKIE,
} from "@/lib/list-filter-preferences";

/**
 * Persist list filter cookies without Server Actions — avoids Next.js post-action RSC refresh
 * (which re-ran all Prisma-backed loaders on every toggle).
 */
export function postListPrefs(prefs: { tasksShowCompleted?: boolean; plansShowArchived?: boolean }) {
  const { tasksShowCompleted, plansShowArchived } = prefs;
  if (tasksShowCompleted === undefined && plansShowArchived === undefined) return;

  let sendTasks = false;
  let sendPlans = false;
  if (tasksShowCompleted !== undefined) {
    const cur = readTasksShowCompletedFromCookie(
      readListPrefCookieRawFromDocument(TASKS_SHOW_COMPLETED_COOKIE),
    );
    if (cur !== tasksShowCompleted) sendTasks = true;
  }
  if (plansShowArchived !== undefined) {
    const cur = readPlansShowArchivedFromCookie(
      readListPrefCookieRawFromDocument(PLANS_SHOW_ARCHIVED_COOKIE),
    );
    if (cur !== plansShowArchived) sendPlans = true;
  }
  if (!sendTasks && !sendPlans) return;

  void fetch("/api/list-prefs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      ...(sendTasks && tasksShowCompleted !== undefined ? { tasksShowCompleted } : {}),
      ...(sendPlans && plansShowArchived !== undefined ? { plansShowArchived } : {}),
    }),
  });
}
