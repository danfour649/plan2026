import Link from "next/link";

import { getCurrentUserId } from "@/auth";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { ExportTasksButton } from "@/components/ExportTasksButton";
import { RefreshTasksButton } from "@/components/RefreshTasksButton";
import { ShowCompletedToggle } from "@/components/ShowCompletedToggle";
import { TaskActionButton } from "@/components/TaskActionButton";
import { TaskContent } from "@/components/TaskContent";
import type { ExportedTask } from "@/lib/export";
import {
  formatShortDate,
  formatShortDateOnly,
  formatShortDateTime,
  getUrgencyPillClasses,
} from "@/lib/format";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { getCachedTasksPage } from "@/lib/data-cache";
import { addTask, completeTask, deleteTask, restoreTask, updateTask } from "@/lib/actions/tasks";

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
    showCompleted?: string | string[];
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
  const showCompleted = Array.isArray(resolvedSearchParams.showCompleted)
    ? resolvedSearchParams.showCompleted[0] === "1"
    : resolvedSearchParams.showCompleted === "1";
  const page = parsePage(resolvedSearchParams.page);
  const limit = parseLimit(resolvedSearchParams.limit, DEFAULT_TASKS_PAGE_SIZE);
  const completedPage = parsePage(resolvedSearchParams.completedPage);

  const { remainingTasks, totalRemaining, completedTasks, totalCompleted, plans } =
    await getCachedTasksPage(userId, showCompleted, page, limit, completedPage);

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
      planId: task.plan?.id ?? null,
      planName: task.plan?.name ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      googleCalendarEventId: task.googleCalendarEventId,
      googleCalendarEventUrl: task.googleCalendarEventUrl,
    })),
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-6 py-4 dark:border-zinc-700 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.tasksPage.title}</h2>
            <div className="flex shrink-0 items-center gap-1">
              <RefreshTasksButton />
              <ExportTasksButton
                tasks={allTasksForExport}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-0 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              />
            </div>
          </div>
          <div className="ml-auto flex flex-nowrap items-center gap-2 sm:gap-4">
            <ShowCompletedToggle showCompleted={showCompleted} />
            <AddTaskDialog action={addTask} plans={plans} />
          </div>
        </div>

        {!hasVisibleTasks ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-blue-300 dark:text-blue-500" aria-hidden>
              ✓
            </p>
            <p className="mt-3 text-base font-medium text-blue-900 dark:text-zinc-100">{t.tasksPage.allClear}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t.tasksPage.noTasks}</p>
          </div>
        ) : (
          <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
            {remainingTasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-3 px-6 py-4 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
                      <div
                        className={`inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${getUrgencyPillClasses(
                          task.urgency,
                        )}`}
                      >
                        <span className="truncate">{task.title}</span>
                        {task.status === "on_hold" ? (
                          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            {t.tasks.onHold}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <TaskContent content={task.content} />
                    <div className="mt-1 flex flex-col gap-0.5 break-words text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-0">
                      <span>{t.tasks.added} <span className="max-sm:hidden sm:inline">{formatShortDate(task.createdAt)}</span><span className="max-sm:inline sm:hidden">{formatShortDateOnly(task.createdAt)}</span></span>
                      {task.dueAt && (
                        <span className="sm:before:content-['·'] sm:before:mr-1">
                          {t.tasks.due}{" "}
                          <span className="max-sm:hidden sm:inline">{formatShortDateTime(task.dueAt)}</span>
                          <span className="max-sm:inline sm:hidden">{formatShortDateOnly(task.dueAt)}</span>
                        </span>
                      )}
                        {task.plan && (
                          <span className="min-w-0 max-sm:block sm:before:content-['·'] sm:before:mr-1">
                            <Link
                              href={`/plans/${task.plan.id}`}
                              className="max-w-[12rem] truncate text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 max-sm:inline-block sm:max-w-none sm:truncate"
                            >
                              {t.tasks.planLabel} {task.plan.name}
                            </Link>
                          </span>
                        )}
                    </div>
                  </div>
                </EditTaskDialog>
                <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center gap-2 sm:flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="order-1"><TaskActionButton action={completeTask} taskId={task.id} label={t.tasks.markDone} successMessage={t.tasks.markedDone} /></span>
                    <span className="order-2"><EditTaskDialog
                    action={updateTask}
                    deleteAction={deleteTask}
                    plans={plans}
                    task={{
                      id: task.id,
                      title: task.title,
                      content: task.content,
                      dueAt: task.dueAt?.toISOString() ?? null,
                      urgency: task.urgency,
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
                  /></span>
                    <AddToCalendarButton
                      taskId={task.id}
                      initiallyLinked={Boolean(task.googleCalendarEventId)}
                    />
                  </div>
                </div>
              </li>
            ))}
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-3 px-6 py-4 transition hover:bg-emerald-50/40 dark:hover:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
                        <div
                          className={`inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ${getUrgencyPillClasses(
                            task.urgency,
                          )}`}
                        >
                          <span className="truncate line-through">{task.title}</span>
                        </div>
                      </div>
                      <TaskContent content={task.content} />
                      <div className="mt-1 flex flex-col gap-0.5 break-words text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-0">
                        <span>{t.tasks.completed} {task.completedAt ? (<><span className="max-sm:hidden sm:inline">{formatShortDate(task.completedAt)}</span><span className="max-sm:inline sm:hidden">{formatShortDateOnly(task.completedAt)}</span></>) : "—"}</span>
                        {task.plan && (
                          <span className="min-w-0 max-sm:block sm:before:content-['·'] sm:before:mr-1">
                            <Link
                              href={`/plans/${task.plan.id}`}
                              className="max-w-[12rem] truncate text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 max-sm:inline-block sm:max-w-none sm:truncate"
                            >
                              {t.tasks.planLabel} {task.plan.name}
                            </Link>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </EditTaskDialog>
                <div className="flex min-w-0 flex-shrink-0 flex-wrap items-center gap-2 sm:flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="order-1"><TaskActionButton action={restoreTask} taskId={task.id} label={t.tasks.restore} successMessage={t.tasks.taskRestored} /></span>
                    <span className="order-2"><EditTaskDialog
                      action={updateTask}
                      deleteAction={deleteTask}
                      plans={plans}
                      task={{
                        id: task.id,
                        title: task.title,
                        content: task.content,
                        dueAt: task.dueAt?.toISOString() ?? null,
                        urgency: task.urgency,
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
                    /></span>
                    <AddToCalendarButton
                      taskId={task.id}
                      initiallyLinked={Boolean(task.googleCalendarEventId)}
                    />
                  </div>
                </div>
              </li>
            ))}
            {totalRemainingPages > 1 && (
              <li className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 px-6 py-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t.common.pageOf.replace("{{current}}", String(page)).replace("{{total}}", String(totalRemainingPages))}
                </span>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link
                      href={`/tasks?page=${page - 1}&limit=${limit}${showCompleted ? "&showCompleted=1" : ""}${showCompleted && completedPage > 1 ? `&completedPage=${completedPage}` : ""}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.previousPage}
                    </Link>
                  ) : null}
                  {page < totalRemainingPages ? (
                    <Link
                      href={`/tasks?page=${page + 1}&limit=${limit}${showCompleted ? "&showCompleted=1" : ""}${showCompleted ? `&completedPage=${completedPage}` : ""}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.nextPage}
                    </Link>
                  ) : null}
                </div>
              </li>
            )}
            {showCompleted && totalCompletedPages > 1 && (
              <li className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 px-6 py-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t.common.pageOf.replace("{{current}}", String(completedPage)).replace("{{total}}", String(totalCompletedPages))} ({t.tasks.completed})
                </span>
                <div className="flex gap-2">
                  {completedPage > 1 ? (
                    <Link
                      href={`/tasks?page=${page}&limit=${limit}&showCompleted=1&completedPage=${completedPage - 1}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.previousPage}
                    </Link>
                  ) : null}
                  {completedPage < totalCompletedPages ? (
                    <Link
                      href={`/tasks?page=${page}&limit=${limit}&showCompleted=1&completedPage=${completedPage + 1}`}
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
    </div>
  );
}
