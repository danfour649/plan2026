import { getCurrentUserId } from "@/auth";
import Link from "next/link";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { TaskActionButton } from "@/components/TaskActionButton";
import { TaskContent } from "@/components/TaskContent";
import { prisma } from "@/lib/prisma";
import { addTask, completeTask, deleteTask, restoreTask } from "@/lib/actions/tasks";

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

export default async function DashboardPage({
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
    orderBy: { createdAt: "desc" },
  });

  const completedTasks = showCompleted
    ? await prisma.task.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
      })
    : [];
  const hasVisibleTasks = remainingTasks.length > 0 || completedTasks.length > 0;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-blue-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-blue-950">Tasks</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-full border border-blue-100 bg-white p-1 text-sm">
              <Link
                href="/dashboard"
                className={`rounded-full px-3 py-1.5 transition ${
                  showCompleted ? "text-zinc-600 hover:bg-blue-50 hover:text-blue-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                Hide completed
              </Link>
              <Link
                href="/dashboard?showCompleted=1"
                className={`rounded-full px-3 py-1.5 transition ${
                  showCompleted ? "bg-blue-100 text-blue-700" : "text-zinc-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                Show completed
              </Link>
            </div>
            <AddTaskDialog action={addTask} />
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
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-900">{task.title}</div>
                  <TaskContent content={task.content} />
                  <div className="mt-1 text-xs text-zinc-500">
                    Added {task.createdAt.toLocaleString()}
                    {task.dueAt && (
                      <> · Due {task.dueAt.toLocaleString()}</>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AddToCalendarButton taskId={task.id} />
                  <TaskActionButton action={completeTask} taskId={task.id} label="Mark done" />
                  <TaskActionButton
                    action={deleteTask}
                    taskId={task.id}
                    label="Delete"
                    variant="muted"
                  />
                </div>
              </li>
            ))}
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-emerald-50/40"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <CompletedCheckIcon />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-700 line-through">{task.title}</div>
                    <TaskContent content={task.content} />
                    <div className="mt-1 text-xs text-zinc-500">
                      Completed {task.completedAt ? task.completedAt.toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AddToCalendarButton taskId={task.id} />
                  <TaskActionButton action={restoreTask} taskId={task.id} label="Restore" />
                  <TaskActionButton
                    action={deleteTask}
                    taskId={task.id}
                    label="Delete"
                    variant="muted"
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
