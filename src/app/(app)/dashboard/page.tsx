import { getCurrentUserId } from "@/auth";
import { AddTaskForm } from "@/components/AddTaskForm";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { TaskActionButton } from "@/components/TaskActionButton";
import { TaskContent } from "@/components/TaskContent";
import { prisma } from "@/lib/prisma";
import { addTask, completeTask, deleteTask } from "@/lib/actions/tasks";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) return null;

  const remainingTasks = await prisma.task.findMany({
    where: { userId, completedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const completedCount = await prisma.task.count({
    where: { userId, completedAt: { not: null } },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-red-50 p-6 shadow-sm shadow-blue-100/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-zinc-600">
              Remaining: <span className="font-medium text-blue-700">{remainingTasks.length}</span>{" "}
              · Completed: <span className="font-medium text-red-600">{completedCount}</span>
            </p>
          </div>
          <AddTaskForm action={addTask} />
        </div>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="border-b border-blue-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-blue-950">Remaining tasks</h2>
        </div>

        {remainingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-blue-300" aria-hidden>
              ✓
            </p>
            <p className="mt-3 text-base font-medium text-blue-900">All clear!</p>
            <p className="mt-1 text-sm text-zinc-500">
              You’re all caught up. Add a new task above when you’re ready.
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
          </ul>
        )}
      </section>
    </div>
  );
}
