import { getServerAuthSession } from "@/auth";
import { TaskActionButton } from "@/components/TaskActionButton";
import { prisma } from "@/lib/prisma";
import { deleteTask, restoreTask } from "@/lib/actions/tasks";

export default async function CompletedPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

  if (!userId) return null;

  const completedTasks = await prisma.task.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Completed</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Total completed: <span className="font-medium">{completedTasks.length}</span>
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">Completed tasks</h2>
        </div>

        {completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-zinc-300" aria-hidden>
              ○
            </p>
            <p className="mt-3 text-base font-medium text-zinc-700">No completed tasks yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              When you mark tasks as done on the dashboard, they’ll show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {completedTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between px-6 py-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{task.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Completed{" "}
                    {task.completedAt ? task.completedAt.toLocaleString() : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
