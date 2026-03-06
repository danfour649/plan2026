import { getServerAuthSession } from "@/auth";
import { AddTaskForm } from "@/components/AddTaskForm";
import { TaskActionButton } from "@/components/TaskActionButton";
import { prisma } from "@/lib/prisma";
import { addTask, completeTask, deleteTask } from "@/lib/actions/tasks";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Remaining: <span className="font-medium">{remainingTasks.length}</span>{" "}
              · Completed: <span className="font-medium">{completedCount}</span>
            </p>
          </div>
          <AddTaskForm action={addTask} />
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Remaining tasks</h2>
        </div>

        {remainingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-zinc-300" aria-hidden>
              ✓
            </p>
            <p className="mt-3 text-base font-medium text-zinc-700">All clear!</p>
            <p className="mt-1 text-sm text-zinc-500">
              You’re all caught up. Add a new task above when you’re ready.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {remainingTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{task.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Added {task.createdAt.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
