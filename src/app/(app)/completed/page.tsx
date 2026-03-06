import { getServerAuthSession } from "@/auth";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { TaskActionButton } from "@/components/TaskActionButton";
import { TaskContent } from "@/components/TaskContent";
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
      <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-blue-50 p-6 shadow-sm shadow-red-100/60">
        <h1 className="text-2xl font-semibold tracking-tight text-red-950">Completed</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Total completed: <span className="font-medium text-red-600">{completedTasks.length}</span>
        </p>
      </div>

      <section className="rounded-2xl border border-red-100 bg-white/90 shadow-sm shadow-red-100/40 backdrop-blur">
        <div className="border-b border-red-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-red-950">Completed tasks</h2>
        </div>

        {completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-red-300" aria-hidden>
              ○
            </p>
            <p className="mt-3 text-base font-medium text-red-900">No completed tasks yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              When you mark tasks as done on the dashboard, they’ll show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-red-100">
            {completedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-red-50/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-900">{task.title}</div>
                  <TaskContent content={task.content} />
                  <div className="mt-1 text-xs text-zinc-500">
                    Completed{" "}
                    {task.completedAt ? task.completedAt.toLocaleString() : "—"}
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
