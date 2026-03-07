import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";
import { ExportPlansButton } from "@/components/ExportPlansButton";
import { RefreshPlansButton } from "@/components/RefreshPlansButton";
import { ShowArchivedPlansToggle } from "@/components/ShowArchivedPlansToggle";
import { PlanStatusSelect } from "@/components/PlanStatusSelect";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { ExportedPlan } from "@/lib/export";
import { updatePlanStatus } from "@/lib/actions/plans";
import { formatPlanStatus } from "@/lib/validations/plan";

/** Colored oval (ring + light fill) around the plan name by priority. */
function getPriorityOvalClasses(priority: number) {
  switch (priority) {
    case 7:
      return "rounded-full px-3 py-1 ring-1 ring-red-200 bg-red-50/80 text-red-900";
    case 6:
      return "rounded-full px-3 py-1 ring-1 ring-orange-200 bg-orange-50/80 text-orange-900";
    case 5:
      return "rounded-full px-3 py-1 ring-1 ring-amber-200 bg-amber-50/80 text-amber-900";
    case 4:
      return "rounded-full px-3 py-1 ring-1 ring-emerald-200 bg-emerald-50/80 text-emerald-900";
    case 3:
      return "rounded-full px-3 py-1 ring-1 ring-cyan-200 bg-cyan-50/80 text-cyan-900";
    case 2:
      return "rounded-full px-3 py-1 ring-1 ring-sky-200 bg-sky-50/80 text-sky-900";
    default:
      return "rounded-full px-3 py-1 ring-1 ring-blue-200 bg-blue-50/80 text-blue-900";
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
    case "on_hold":
      return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

const ARCHIVED_STATUSES = ["completed", "abandoned"] as const;

export default async function PlansPage({
  searchParams,
}: {
  searchParams?: Promise<{ showArchived?: string | string[] }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const showArchived = Array.isArray(resolvedSearchParams.showArchived)
    ? resolvedSearchParams.showArchived[0] === "1"
    : resolvedSearchParams.showArchived === "1";

  const allPlans = await prisma.plan.findMany({
    where: {
      OR: [
        { userId },
        { shares: { some: { sharedWithUserId: userId } } },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { tasks: { select: { id: true, completedAt: true } } },
  });

  const plans = showArchived
    ? allPlans
    : allPlans.filter((p) => !ARCHIVED_STATUSES.includes(p.status as (typeof ARCHIVED_STATUSES)[number]));

  const plansForExport: ExportedPlan[] = plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    goal: p.goal,
    startAt: p.startAt.toISOString(),
    endAt: p.endAt.toISOString(),
    actualStartAt: p.actualStartAt?.toISOString() ?? null,
    actualEndAt: p.actualEndAt?.toISOString() ?? null,
    status: p.status,
    priority: p.priority,
    percentCompleted: p.percentCompleted,
    notes: p.notes,
    color: p.color,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    taskSummaries: p.tasks.map((t) => ({
      id: t.id,
      completedAt: t.completedAt?.toISOString() ?? null,
    })),
  }));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-6 py-4 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-blue-950">{t.plansPage.title}</h2>
            <div className="flex shrink-0 items-center gap-1">
              <RefreshPlansButton />
              <ExportPlansButton
                plans={plansForExport}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-0 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="ml-auto flex flex-nowrap items-center gap-2 sm:gap-4">
            <ShowArchivedPlansToggle showArchived={showArchived} />
            <Link
              href="/plans/new"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 sm:h-auto sm:w-fit sm:px-4 sm:py-2"
              aria-label={t.plans.addPlanAria}
            >
              <span className="text-xl font-medium sm:hidden" aria-hidden>+</span>
              <span className="hidden text-sm font-medium sm:inline">{t.plansPage.addPlan}</span>
            </Link>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-blue-300" aria-hidden>
              📋
            </p>
            <p className="mt-3 text-base font-medium text-blue-900">{t.plansPage.noPlans}</p>
            <p className="mt-1 text-sm text-zinc-500">{t.plansPage.createPlan}</p>
            <Link
              href="/plans/new"
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              {t.plansPage.addPlan}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-blue-100">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-col gap-3 px-6 py-4 transition hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <Link
                  href={`/plans/${plan.id}`}
                  className="flex min-w-0 flex-1 flex-wrap items-start gap-3 sm:flex-nowrap sm:items-center"
                >
                  {plan.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-pasted URL, arbitrary host
                    <img
                      src={plan.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-blue-100 bg-zinc-100 object-contain object-center"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 overflow-visible">
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 pl-0.5">
                      <span
                        className={`inline-block max-w-full break-words rounded-full px-3 py-1 text-sm font-semibold sm:max-w-[18rem] sm:truncate ${getPriorityOvalClasses(
                          plan.priority,
                        )}`}
                      >
                        {plan.name}
                      </span>
                      {plan.userId !== userId ? (
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          {t.plansPage.sharedWithMe}
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-medium ${getStatusPillClasses(
                          plan.status,
                        )}`}
                      >
                        {formatPlanStatus(plan.status)}
                      </span>
                      <span className="shrink-0 text-sm font-medium text-blue-700">
                        {plan.percentCompleted}%
                      </span>
                    </div>
                    {(plan.goal ?? plan.description) && (
                      <p className="mt-0.5 line-clamp-2 break-words text-sm text-zinc-500 sm:line-clamp-1">
                        {plan.goal ?? plan.description}
                      </p>
                    )}
                    <p className="mt-1 break-words text-xs text-zinc-500">
                      {plan.startAt.toLocaleDateString()} – {plan.endAt.toLocaleDateString()}
                      {" · "}
                      {(() => {
                        const total = plan.tasks.length;
                        const completed = plan.tasks.filter((t) => t.completedAt != null).length;
                        return total === 0
                          ? "0 tasks"
                          : `${completed} of ${total} task${total !== 1 ? "s" : ""} completed`;
                      })()}
                    </p>
                  </div>
                </Link>
                {plan.userId === userId ? (
                  <div className="flex w-full shrink-0 justify-end gap-2 sm:w-auto sm:justify-start">
                    <div className="hidden sm:block">
                      <PlanStatusSelect
                        planId={plan.id}
                        currentStatus={plan.status}
                        action={updatePlanStatus}
                      />
                    </div>
                    <Link
                      href={`/plans/${plan.id}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
                    >
                      {t.plansPage.edit}
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/plans/${plan.id}`}
                    className="shrink-0 self-end rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 sm:self-auto"
                  >
                    {t.plansPage.view}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
