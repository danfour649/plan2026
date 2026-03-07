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
import { prisma } from "@/lib/prisma";
import { addTask, completeTask, deleteTask, restoreTask, updateTask } from "@/lib/actions/tasks";

function getUrgencyPillClasses(urgency: number) {
  switch (urgency) {
    case 7:
      return "bg-red-100 text-red-700 ring-1 ring-red-200";
    case 6:
      return "bg-orange-100 text-orange-700 ring-1 ring-orange-200";
    case 5:
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case 4:
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case 3:
      return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200";
    case 2:
      return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
    default:
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  }
}

function CompletedCheckIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
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

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ showCompleted?: string | string[] }>;
}) {
  const userId = await getCurrentUserId();

  if (!userId) return null;
  const resolvedSearchParams = (await searchParams) ?? {};
  const showCompleted = Array.isArray(resolvedSearchParams.showCompleted)
    ? resolvedSearchParams.showCompleted[0] === "1"
    : resolvedSearchParams.showCompleted === "1";

  const remainingTasks = await prisma.task.findMany({
    where: { userId, completedAt: null },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    include: {
      plan: { select: { id: true, name: true } },
      attachments: { select: { id: true, url: true, filename: true, size: true } },
    },
  });

  const completedTasks = showCompleted
    ? await prisma.task.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: [{ urgency: "desc" }, { completedAt: "desc" }],
        include: {
          plan: { select: { id: true, name: true } },
          attachments: { select: { id: true, url: true, filename: true, size: true } },
        },
      })
    : [];
  const hasVisibleTasks = remainingTasks.length > 0 || completedTasks.length > 0;

  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const allTasksForExport: ExportedTask[] = [
    ...remainingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      dueAt: t.dueAt?.toISOString() ?? null,
      urgency: t.urgency,
      completedAt: null as string | null,
      planId: t.plan?.id ?? null,
      planName: t.plan?.name ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      googleCalendarEventId: t.googleCalendarEventId,
      googleCalendarEventUrl: t.googleCalendarEventUrl,
    })),
    ...completedTasks.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      dueAt: t.dueAt?.toISOString() ?? null,
      urgency: t.urgency,
      completedAt: t.completedAt?.toISOString() ?? null,
      planId: t.plan?.id ?? null,
      planName: t.plan?.name ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      googleCalendarEventId: t.googleCalendarEventId,
      googleCalendarEventUrl: t.googleCalendarEventUrl,
    })),
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-blue-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-blue-950">Tasks</h2>
            <RefreshTasksButton />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <ExportTasksButton tasks={allTasksForExport} />
            <ShowCompletedToggle showCompleted={showCompleted} />
            <AddTaskDialog action={addTask} plans={plans} />
          </div>
        </div>

        {!hasVisibleTasks ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-blue-300" aria-hidden>
              ✓
            </p>
            <p className="mt-3 text-base font-medium text-blue-900">All clear!</p>
            <p className="mt-1 text-sm text-zinc-500">
              You’re all caught up. Add a new task when you’re ready.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-blue-100">
            {remainingTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-blue-50/40"
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
                  <div className="min-w-0 flex-1">
                    <div
                      className={`inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ${getUrgencyPillClasses(
                        task.urgency,
                      )}`}
                    >
                      <span className="truncate">{task.title}</span>
                    </div>
                    <TaskContent content={task.content} />
                    <div className="mt-1 text-xs text-zinc-500">
                      Added {task.createdAt.toLocaleString()}
                      {task.dueAt && <> · Due {task.dueAt.toLocaleString()}</>}
                      {task.plan && (
                        <>
                          {" · "}
                          <Link
                            href={`/plans/${task.plan.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Plan: {task.plan.name}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </EditTaskDialog>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <AddToCalendarButton
                      taskId={task.id}
                      initiallyLinked={Boolean(task.googleCalendarEventId)}
                    />
                    <TaskActionButton action={completeTask} taskId={task.id} label="Mark done" />
                  </div>
                  <EditTaskDialog
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
                </div>
              </li>
            ))}
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-emerald-50/40"
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
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <CompletedCheckIcon />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ${getUrgencyPillClasses(
                          task.urgency,
                        )}`}
                      >
                        <span className="truncate line-through">{task.title}</span>
                      </div>
                      <TaskContent content={task.content} />
                      <div className="mt-1 text-xs text-zinc-500">
                        Completed {task.completedAt ? task.completedAt.toLocaleString() : "—"}
                        {task.plan && (
                          <>
                            {" · "}
                            <Link
                              href={`/plans/${task.plan.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              Plan: {task.plan.name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </EditTaskDialog>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <AddToCalendarButton
                      taskId={task.id}
                      initiallyLinked={Boolean(task.googleCalendarEventId)}
                    />
                    <TaskActionButton action={restoreTask} taskId={task.id} label="Restore" />
                  </div>
                  <EditTaskDialog
                    action={updateTask}
                    deleteAction={deleteTask}
                    plans={plans}
                    task={{
                      id: task.id,
                      title: task.title,
                      content: task.content,
                      dueAt: task.dueAt?.toISOString() ?? null,
                      urgency: task.urgency,
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
          </ul>
        )}
      </section>
    </div>
  );
}
