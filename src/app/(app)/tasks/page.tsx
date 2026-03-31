import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";

import { TasksListWithLocalSearch } from "@/components/TasksListWithLocalSearch";
import { TasksShowCompletedRoot } from "@/components/TasksShowCompletedRoot";
import type { TaskMetadataLabels } from "@/components/TaskMetadata";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { getCachedTasksPage } from "@/lib/data-cache";
import { addTask } from "@/lib/actions/tasks";
import {
  readTasksShowCompletedFromCookie,
  TASKS_SHOW_COMPLETED_COOKIE,
} from "@/lib/list-filter-preferences";

const DEFAULT_TASKS_PAGE_SIZE = 50;
const MAX_TASKS_PAGE_SIZE = 100;

function parsePage(value: string | string[] | undefined): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? "1"), 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function parseLimit(value: string | string[] | undefined, defaultSize: number): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? defaultSize), 10);
  if (Number.isNaN(n) || n < 1) return defaultSize;
  return Math.min(n, MAX_TASKS_PAGE_SIZE);
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string | string[];
    limit?: string | string[];
    completedPage?: string | string[];
  }>;
}) {
  const userId = await getCurrentUserId();

  if (!userId) return null;
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const showCompleted = readTasksShowCompletedFromCookie(
    cookieStore.get(TASKS_SHOW_COMPLETED_COOKIE)?.value,
  );
  const page = parsePage(resolvedSearchParams.page);
  const limit = parseLimit(resolvedSearchParams.limit, DEFAULT_TASKS_PAGE_SIZE);
  const completedPage = parsePage(resolvedSearchParams.completedPage);

  const { remainingTasks, totalRemaining, completedTasks, totalCompleted, plans } =
    await getCachedTasksPage(userId, page, limit, completedPage);

  const hasVisibleTasks = remainingTasks.length > 0 || completedTasks.length > 0;
  const totalRemainingPages = Math.ceil(totalRemaining / limit) || 1;
  const totalCompletedPages = Math.ceil(totalCompleted / limit) || 1;

  const metaLabels: TaskMetadataLabels = {
    added: t.tasks.added,
    completed: t.tasks.completed,
    due: t.tasks.due,
    planLabel: t.tasks.planLabel,
  };
  const recurrenceLabels = {
    daily: t.tasks.recursDaily,
    weekly: t.tasks.recursWeekly,
    monthly: t.tasks.recursMonthly,
  };

  return (
    <div className="space-y-8">
      <TasksShowCompletedRoot initialShowCompleted={showCompleted}>
        <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
          <TasksListWithLocalSearch
            title={t.tasksPage.title}
            hasVisibleTasks={hasVisibleTasks}
            emptyTitle={t.tasksPage.allClear}
            emptyDescription={t.tasksPage.noTasks}
            addTask={addTask}
            remainingTasks={remainingTasks}
            completedTasks={completedTasks}
            plans={plans}
            metaLabels={metaLabels}
            recurrenceLabels={recurrenceLabels}
            page={page}
            limit={limit}
            completedPage={completedPage}
            totalRemainingPages={totalRemainingPages}
            totalCompletedPages={totalCompletedPages}
            showCompleted={showCompleted}
          />
        </section>
      </TasksShowCompletedRoot>
    </div>
  );
}
