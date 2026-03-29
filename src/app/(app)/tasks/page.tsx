import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { ExportTasksButton } from "@/components/ExportTasksButton";
import { RefreshTasksButton } from "@/components/RefreshTasksButton";
import { TasksShowCompletedRoot, TasksShowCompletedToggle } from "@/components/TasksShowCompletedRoot";
import { TaskActionButton } from "@/components/TaskActionButton";
import { TaskContent } from "@/components/TaskContent";
import { TaskMetadata, type TaskMetadataLabels } from "@/components/TaskMetadata";
import { UrgencyPill } from "@/components/UrgencyPill";
import type { ExportedTask } from "@/lib/export";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { getCachedTasksPage } from "@/lib/data-cache";
import { taskRecurrenceHint } from "@/lib/task-recurrence-ui";
import { addTask, completeTask, deleteTask, restoreTask, updateTask } from "@/lib/actions/tasks";
import {
  readTasksShowCompletedFromCookie,
  TASKS_SHOW_COMPLETED_COOKIE,
} from "@/lib/list-filter-preferences";

function CompletedCheckIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M5 10.5L8.25 13.75L15 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

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
          <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
            {remainingTasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-row items-start gap-3 px-6 py-4 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 sm:items-center sm:justify-between sm:gap-4"
              >
                <EditTaskDialog
                  action={updateTask}
                  deleteAction={deleteTask}
                  triggerClassName="min-w-0 flex-1 cursor-pointer rounded-xl px-1 py-1 -mx-1 -my-1"
                  showButton={false}
                  plans={plans}
                  task={{
                    id: task.id,
                    title: task.title,
                    content: task.content,
                    dueAt: task.dueAt?.toISOString() ?? null,
                    urgency: task.urgency,
                    recurrence: task.recurrence ?? null,
                    status: task.status,
                    completedAt: task.completedAt?.toISOString() ?? null,
                    planId: task.plan?.id ?? null,
                    planName: task.plan?.name ?? null,
                    createdAt: task.createdAt.toISOString(),
                    updatedAt: task.updatedAt.toISOString(),
                    attachments: task.attachments.map((a) => ({
                      id: a.id,
                      url: a.url,
                      filename: a.filename,
                      size: a.size,
                    })),
                  }}
                >
                  <div className="min-w-0 flex-1 overflow-visible">
                    <div className="pt-0.5 pl-0.5">
                      <UrgencyPill urgency={task.urgency} title={task.title} status={task.status} onHoldLabel={t.tasks.onHold} />
                    </div>
                    <TaskContent content={task.content} />
                    <TaskMetadata
                      createdAt={task.createdAt}
                      dueAt={task.dueAt}
                      recurrenceHint={taskRecurrenceHint(task.recurrence, recurrenceLabels)}
                      plan={task.plan}
                      labels={metaLabels}
                    />
                  </div>
                </EditTaskDialog>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:flex-shrink-0">
                  <TaskActionButton
                    compact
                    actionVisual="complete"
                    action={completeTask}
                    taskId={task.id}
                    label={t.tasks.markDone}
                    successMessage={t.tasks.markedDone}
                    recurringSuccessMessage={t.tasks.markedDoneRecurring}
                  />
                  <AddToCalendarButton
                    taskId={task.id}
                    initiallyLinked={Boolean(task.googleCalendarEventId)}
                  />
                  <EditTaskDialog
                    compactListTrigger
                    action={updateTask}
                    deleteAction={deleteTask}
                    plans={plans}
                    task={{
                      id: task.id,
                      title: task.title,
                      content: task.content,
                      dueAt: task.dueAt?.toISOString() ?? null,
                      urgency: task.urgency,
                      recurrence: task.recurrence ?? null,
                      status: task.status,
                      completedAt: task.completedAt?.toISOString() ?? null,
                      planId: task.plan?.id ?? null,
                      planName: task.plan?.name ?? null,
                      createdAt: task.createdAt.toISOString(),
                      updatedAt: task.updatedAt.toISOString(),
                      attachments: task.attachments.map((a) => ({
                        id: a.id,
                        url: a.url,
                        filename: a.filename,
                        size: a.size,
                      })),
                    }}
                  />
                </div>
              </li>
            ))}
            {completedTasks.map((task) => (
              <li
                key={task.id}
                data-completed-only
                className="flex flex-row items-start gap-3 px-6 py-4 transition hover:bg-emerald-50/40 dark:hover:bg-zinc-800/50 sm:items-center sm:justify-between sm:gap-4"
              >
                <EditTaskDialog
                  action={updateTask}
                  deleteAction={deleteTask}
                  triggerClassName="min-w-0 flex-1 cursor-pointer rounded-xl px-1 py-1 -mx-1 -my-1"
                  showButton={false}
                  plans={plans}
                  task={{
                    id: task.id,
                    title: task.title,
                    content: task.content,
                    dueAt: task.dueAt?.toISOString() ?? null,
                    urgency: task.urgency,
                    recurrence: task.recurrence ?? null,
                    status: task.status,
                    completedAt: task.completedAt?.toISOString() ?? null,
                    planId: task.plan?.id ?? null,
                    planName: task.plan?.name ?? null,
                    createdAt: task.createdAt.toISOString(),
                    updatedAt: task.updatedAt.toISOString(),
                    attachments: task.attachments.map((a) => ({
                      id: a.id,
                      url: a.url,
                      filename: a.filename,
                      size: a.size,
                    })),
                  }}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3 overflow-visible">
                    <CompletedCheckIcon />
                    <div className="min-w-0 flex-1 overflow-visible">
                      <div className="pt-0.5 pl-0.5">
                        <UrgencyPill urgency={task.urgency} title={task.title} completed />
                      </div>
                      <TaskContent content={task.content} />
                      <TaskMetadata
                        isCompleted
                        createdAt={task.createdAt}
                        completedAt={task.completedAt}
                        dueAt={task.dueAt}
                        recurrenceHint={taskRecurrenceHint(task.recurrence, recurrenceLabels)}
                        plan={task.plan}
                        labels={metaLabels}
                      />
                    </div>
                  </div>
                </EditTaskDialog>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:flex-shrink-0">
                  <TaskActionButton
                    compact
                    actionVisual="restore"
                    action={restoreTask}
                    taskId={task.id}
                    label={t.tasks.restore}
                    successMessage={t.tasks.taskRestored}
                  />
                  <AddToCalendarButton
                    taskId={task.id}
                    initiallyLinked={Boolean(task.googleCalendarEventId)}
                  />
                  <EditTaskDialog
                    compactListTrigger
                    action={updateTask}
                    deleteAction={deleteTask}
                    plans={plans}
                    task={{
                      id: task.id,
                      title: task.title,
                      content: task.content,
                      dueAt: task.dueAt?.toISOString() ?? null,
                      urgency: task.urgency,
                      recurrence: task.recurrence ?? null,
                      status: task.status,
                      completedAt: task.completedAt?.toISOString() ?? null,
                      planId: task.plan?.id ?? null,
                      planName: task.plan?.name ?? null,
                      createdAt: task.createdAt.toISOString(),
                      updatedAt: task.updatedAt.toISOString(),
                      attachments: task.attachments.map((a) => ({
                        id: a.id,
                        url: a.url,
                        filename: a.filename,
                        size: a.size,
                      })),
                    }}
                  />
                </div>
              </li>
            ))}
            {totalRemainingPages > 1 && (
              <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3">
                <span className="text-sm text-muted">
                  {t.common.pageOf.replace("{{current}}", String(page)).replace("{{total}}", String(totalRemainingPages))}
                </span>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link
                      href={`/tasks?page=${page - 1}&limit=${limit}${completedPage > 1 ? `&completedPage=${completedPage}` : ""}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.previousPage}
                    </Link>
                  ) : null}
                  {page < totalRemainingPages ? (
                    <Link
                      href={`/tasks?page=${page + 1}&limit=${limit}${completedPage > 1 ? `&completedPage=${completedPage}` : ""}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.nextPage}
                    </Link>
                  ) : null}
                </div>
              </li>
            )}
            {showCompleted && totalCompletedPages > 1 && (
              <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3">
                <span className="text-sm text-muted">
                  {t.common.pageOf.replace("{{current}}", String(completedPage)).replace("{{total}}", String(totalCompletedPages))} ({t.tasks.completed})
                </span>
                <div className="flex gap-2">
                  {completedPage > 1 ? (
                    <Link
                      href={`/tasks?page=${page}&limit=${limit}&completedPage=${completedPage - 1}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.previousPage}
                    </Link>
                  ) : null}
                  {completedPage < totalCompletedPages ? (
                    <Link
                      href={`/tasks?page=${page}&limit=${limit}&completedPage=${completedPage + 1}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.nextPage}
                    </Link>
                  ) : null}
                </div>
              </li>
            )}
          </ul>
        )}
        </section>
      </TasksShowCompletedRoot>
    </div>
  );
}
