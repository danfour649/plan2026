import Link from "next/link";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";

function getPriorityPillClasses(priority: number) {
  switch (priority) {
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

function getStatusPillClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case "abandoned":
      return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200";
    case "started":
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

export default async function PlansPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-blue-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-blue-950">Plans</h2>
          <Link
            href="/plans/new"
            className="inline-flex w-fit rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700"
          >
            Add plan
          </Link>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-blue-300" aria-hidden>
              📋
            </p>
            <p className="mt-3 text-base font-medium text-blue-900">No plans yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Create a plan to group tasks and track progress.
            </p>
            <Link
              href="/plans/new"
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Add plan
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-blue-100">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/plans/${plan.id}`}
                  className="flex flex-wrap items-center gap-3 px-6 py-4 transition hover:bg-blue-50/40 sm:flex-nowrap"
                >
                  {plan.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-pasted URL, arbitrary host
                    <img
                      src={plan.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-blue-100 object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getPriorityPillClasses(
                          plan.priority,
                        )}`}
                      >
                        {plan.priority}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${getStatusPillClasses(
                          plan.status,
                        )}`}
                      >
                        {plan.status}
                      </span>
                      <span className="text-sm font-medium text-blue-700">
                        {plan.percentCompleted}%
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-blue-950 truncate">{plan.name}</p>
                    {(plan.goal ?? plan.description) && (
                      <p className="mt-0.5 text-sm text-zinc-500 line-clamp-1">
                        {plan.goal ?? plan.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      {plan.startAt.toLocaleDateString()} – {plan.endAt.toLocaleDateString()}
                      {" · "}
                      {plan._count.tasks} task{plan._count.tasks !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
