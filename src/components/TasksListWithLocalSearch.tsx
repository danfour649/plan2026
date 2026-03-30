"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { ExportTasksButton } from "@/components/ExportTasksButton";
import { RefreshTasksButton } from "@/components/RefreshTasksButton";
import { TaskActionButton } from "@/components/TaskActionButton";
import { TaskContent } from "@/components/TaskContent";
import { TaskMetadata, type TaskMetadataLabels } from "@/components/TaskMetadata";
import { TasksShowCompletedToggle } from "@/components/TasksShowCompletedRoot";
import { useTranslations } from "@/components/TranslationsProvider";
import { UrgencyPill } from "@/components/UrgencyPill";
import type { CachedTasksPageTask } from "@/lib/data-cache";
import { taskMatchesLocalSearch } from "@/lib/task-list-local-search";
import { tasksPageSlicesToExportedTasks } from "@/lib/tasks-page-export-map";
import { taskRecurrenceHint } from "@/lib/task-recurrence-ui";
import { addTask as addTaskServer, completeTask, deleteTask, restoreTask, updateTask } from "@/lib/actions/tasks";

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

function coerceDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function toIso(d: Date | string | null | undefined): string | null {
  if (d == null) return null;
  return coerceDate(d).toISOString();
}

export function TasksListWithLocalSearch({
  title,
  hasVisibleTasks,
  emptyTitle,
  emptyDescription,
  addTask,
  remainingTasks,
  completedTasks,
  plans,
  metaLabels,
  recurrenceLabels,
  page,
  limit,
  completedPage,
  totalRemainingPages,
  totalCompletedPages,
  showCompleted,
}: {
  title: string;
  hasVisibleTasks: boolean;
  emptyTitle: string;
  emptyDescription: string;
  addTask: typeof addTaskServer;
  remainingTasks: CachedTasksPageTask[];
  completedTasks: CachedTasksPageTask[];
  plans: { id: string; name: string }[];
  metaLabels: TaskMetadataLabels;
  recurrenceLabels: { daily: string; weekly: string; monthly: string };
  page: number;
  limit: number;
  completedPage: number;
  totalRemainingPages: number;
  totalCompletedPages: number;
  showCompleted: boolean;
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();

  const filteredRemaining = useMemo(
    () => (needle ? remainingTasks.filter((task) => taskMatchesLocalSearch(task, needle)) : remainingTasks),
    [remainingTasks, needle],
  );

  const filteredCompleted = useMemo(
    () => (needle ? completedTasks.filter((task) => taskMatchesLocalSearch(task, needle)) : completedTasks),
    [completedTasks, needle],
  );

  const tasksForExport = useMemo(
    () => tasksPageSlicesToExportedTasks(filteredRemaining, filteredCompleted),
    [filteredRemaining, filteredCompleted],
  );

  const hadAnyTasksOnPage = remainingTasks.length > 0 || completedTasks.length > 0;
  const filterHidEverything =
    needle.length > 0 && hadAnyTasksOnPage && filteredRemaining.length === 0 && filteredCompleted.length === 0;

  return (
    <>
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{title}</h2>
          <div className="flex shrink-0 items-center gap-1">
            <RefreshTasksButton />
            <ExportTasksButton
              tasks={tasksForExport}
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
          <p className="mt-3 text-base font-medium text-blue-900 dark:text-zinc-100">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <div className="border-b border-border px-6 py-3">
            <label className="sr-only" htmlFor="tasks-local-search">
              {t.tasksPage.searchTasks}
            </label>
            <input
              id="tasks-local-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.tasksPage.searchTasksPlaceholder}
              autoComplete="off"
              className="w-full max-w-md rounded-xl border border-border bg-white px-3 py-2 text-sm text-blue-950 shadow-inner placeholder:text-muted focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/50"
            />
          </div>
          <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
        {filterHidEverything ? (
          <li className="px-6 py-10 text-center text-sm text-muted">{t.tasksPage.noTasksMatchSearch}</li>
        ) : null}
        {!filterHidEverything
          ? filteredRemaining.map((task) => (
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
                    dueAt: toIso(task.dueAt),
                    urgency: task.urgency,
                    recurrence: task.recurrence ?? null,
                    status: task.status,
                    completedAt: toIso(task.completedAt),
                    planId: task.plan?.id ?? null,
                    planName: task.plan?.name ?? null,
                    createdAt: coerceDate(task.createdAt).toISOString(),
                    updatedAt: coerceDate(task.updatedAt).toISOString(),
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
                      <UrgencyPill
                        urgency={task.urgency}
                        title={task.title}
                        status={task.status}
                        onHoldLabel={t.tasks.onHold}
                      />
                    </div>
                    <TaskContent content={task.content} />
                    <TaskMetadata
                      createdAt={coerceDate(task.createdAt)}
                      dueAt={task.dueAt ? coerceDate(task.dueAt) : null}
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
                      dueAt: toIso(task.dueAt),
                      urgency: task.urgency,
                      recurrence: task.recurrence ?? null,
                      status: task.status,
                      completedAt: toIso(task.completedAt),
                      planId: task.plan?.id ?? null,
                      planName: task.plan?.name ?? null,
                      createdAt: coerceDate(task.createdAt).toISOString(),
                      updatedAt: coerceDate(task.updatedAt).toISOString(),
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
            ))
          : null}
        {!filterHidEverything
          ? filteredCompleted.map((task) => (
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
                    dueAt: toIso(task.dueAt),
                    urgency: task.urgency,
                    recurrence: task.recurrence ?? null,
                    status: task.status,
                    completedAt: toIso(task.completedAt),
                    planId: task.plan?.id ?? null,
                    planName: task.plan?.name ?? null,
                    createdAt: coerceDate(task.createdAt).toISOString(),
                    updatedAt: coerceDate(task.updatedAt).toISOString(),
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
                        createdAt={coerceDate(task.createdAt)}
                        completedAt={task.completedAt ? coerceDate(task.completedAt) : null}
                        dueAt={task.dueAt ? coerceDate(task.dueAt) : null}
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
                      dueAt: toIso(task.dueAt),
                      urgency: task.urgency,
                      recurrence: task.recurrence ?? null,
                      status: task.status,
                      completedAt: toIso(task.completedAt),
                      planId: task.plan?.id ?? null,
                      planName: task.plan?.name ?? null,
                      createdAt: coerceDate(task.createdAt).toISOString(),
                      updatedAt: coerceDate(task.updatedAt).toISOString(),
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
            ))
          : null}
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
              {t.common.pageOf.replace("{{current}}", String(completedPage)).replace("{{total}}", String(totalCompletedPages))}{" "}
              ({t.tasks.completed})
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
        </>
      )}
    </>
  );
}
