import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { getCurrentUserId } from "@/auth";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { TaskActionButton } from "@/components/TaskActionButton";
import { TaskContent } from "@/components/TaskContent";
import {
  formatShortDate,
  formatShortDateOnly,
  formatShortDateTime,
  getUrgencyPillClasses,
} from "@/lib/format";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { getCachedActionsPage } from "@/lib/data-cache";
import { addTask, completeTask, deleteTask, updateTask } from "@/lib/actions/tasks";

export default async function ActionsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const { tasks, plans } = await getCachedActionsPage(userId);

  const now = new Date();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-6 py-4 dark:border-zinc-700 sm:gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">
            {t.actionsPage.title}
          </h2>
          <AddTaskDialog action={addTask} plans={plans} />
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-blue-300 dark:text-blue-500" aria-hidden>
              ✓
            </p>
            <p className="mt-3 text-base font-medium text-blue-900 dark:text-zinc-100">
              {t.actionsPage.emptyTitle}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {t.actionsPage.emptyDescription}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/plans"
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {t.actionsPage.viewPlans}
              </Link>
              <AddTaskDialog action={addTask} plans={plans} />
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
            {tasks.map((task) => {
              const isOverdue = task.dueAt !== null && task.dueAt < now;
              return (
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
                      <div className="pt-0.5 pl-0.5 flex items-center gap-2">
                        {isOverdue && (
                          <span
                            className="shrink-0 text-amber-600 dark:text-amber-400"
                            title={t.tasks.overdue}
                            aria-label={t.tasks.overdue}
                          >
                            <AlertTriangle className="h-5 w-5" />
                          </span>
                        )}
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
                        <span>
                          {t.tasks.added}{" "}
                          <span className="max-sm:hidden sm:inline">
                            {formatShortDate(task.createdAt)}
                          </span>
                          <span className="max-sm:inline sm:hidden">
                            {formatShortDateOnly(task.createdAt)}
                          </span>
                        </span>
                        {task.dueAt && (
                          <span className="sm:before:content-['·'] sm:before:mr-1">
                            {t.tasks.due}{" "}
                            <span className="max-sm:hidden sm:inline">
                              {formatShortDateTime(task.dueAt)}
                            </span>
                            <span className="max-sm:inline sm:hidden">
                              {formatShortDateOnly(task.dueAt)}
                            </span>
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
                  <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:flex-shrink-0">
                    <TaskActionButton
                      compact
                      actionVisual="complete"
                      action={completeTask}
                      taskId={task.id}
                      label={t.tasks.markDone}
                      successMessage={t.tasks.markedDone}
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
                    <AddToCalendarButton
                      taskId={task.id}
                      initiallyLinked={Boolean(task.googleCalendarEventId)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
