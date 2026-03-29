import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { ExportTasksButton } from "@/components/ExportTasksButton";
import { RefreshTasksButton } from "@/components/RefreshTasksButton";
import { TasksListWithLocalSearch } from "@/components/TasksListWithLocalSearch";
import { TasksShowCompletedRoot, TasksShowCompletedToggle } from "@/components/TasksShowCompletedRoot";
import type { TaskMetadataLabels } from "@/components/TaskMetadata";
import type { ExportedTask } from "@/lib/export";
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

  const allTasksForExport: ExportedTask[] = [
    ...remainingTasks.map((task) => ({
      id: task.id,
      title: task.title,
      content: task.content,
      dueAt: task.dueAt?.toISOString() ?? null,
      urgency: task.urgency,
      status: task.status,
      completedAt: null as string | null,
      recurrence: task.recurrence ?? null,
      planId: task.plan?.id ?? null,
      planName: task.plan?.name ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      googleCalendarEventId: task.googleCalendarEventId,
      googleCalendarEventUrl: task.googleCalendarEventUrl,
    })),
    ...completedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      content: task.content,
      dueAt: task.dueAt?.toISOString() ?? null,
      urgency: task.urgency,
      status: task.status,
      completedAt: task.completedAt?.toISOString() ?? null,
      recurrence: task.recurrence ?? null,
      planId: task.plan?.id ?? null,
      planName: task.plan?.name ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      googleCalendarEventId: task.googleCalendarEventId,
      googleCalendarEventUrl: task.googleCalendarEventUrl,
    })),
  ];

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
          <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.tasksPage.title}</h2>
              <div className="flex shrink-0 items-center gap-1">
                <RefreshTasksButton />
                <ExportTasksButton
                  tasks={allTasksForExport}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 p-0 text-amber-700 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-800/50"
                />
              </div>
            </div>
            <div className="ml-auto flex flex-nowrap items-center gap-2 sm:gap-4">
              <TasksShowCompletedToggle />
              <AddTaskDialog action={addTask} plans={plans} />
            </div>
          </div>

          {!hasVisibleTasks ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-4xl font-light text-blue-300 dark:text-blue-500" aria-hidden>
                ✓
              </p>
              <p className="mt-3 text-base font-medium text-blue-900 dark:text-zinc-100">{t.tasksPage.allClear}</p>
              <p className="mt-1 text-sm text-muted">{t.tasksPage.noTasks}</p>
            </div>
          ) : (
            <TasksListWithLocalSearch
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
          )}
        </section>
      </TasksShowCompletedRoot>
    </div>
  );
}
