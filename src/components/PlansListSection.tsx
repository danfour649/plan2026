import { Pencil } from "lucide-react";
import Link from "next/link";

import { AddTaskDialog } from "@/components/AddTaskDialog";
import { PlanFlag } from "@/components/PlanFlag";
import { PlanStatusSelect } from "@/components/PlanStatusSelect";
import { hasPlanFlag } from "@/lib/plan-flags";
import { getPriorityOvalClasses, getStatusPillClasses } from "@/lib/format";
import { formatTasksCount, getTranslations } from "@/lib/i18n";
import { getCachedPlansPage } from "@/lib/data-cache";
import { updatePlanStatus } from "@/lib/actions/plans";
import type { ActionResult } from "@/lib/actions/tasks";

type PlanRow = Awaited<ReturnType<typeof getCachedPlansPage>>["activePlans"][number];
type Messages = ReturnType<typeof getTranslations>;
type AddTaskAction = (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export function PlansListSection({
  plans,
  userId,
  t,
  page,
  limit,
  totalPages,
  addTaskAction,
  plansForDropdown,
}: {
  plans: PlanRow[];
  userId: string;
  t: Messages;
  page: number;
  limit: number;
  totalPages: number;
  addTaskAction?: AddTaskAction;
  plansForDropdown?: { id: string; name: string }[];
}) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-4xl font-light text-blue-300 dark:text-blue-500" aria-hidden>
          📋
        </p>
        <p className="mt-3 text-base font-medium text-blue-900 dark:text-zinc-100">{t.plansPage.noPlans}</p>
        <p className="mt-1 text-sm text-muted">{t.plansPage.createPlan}</p>
        <Link
          href="/plans/new"
          prefetch={false}
          className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {t.plansPage.addPlan}
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
      {plans.map((plan) => (
        <li
          key={plan.id}
          className="relative block px-6 py-4 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50"
        >
          <Link href={`/plans/${plan.id}`} prefetch={false} className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start gap-3">
              {plan.imageUrl ? (
                <div
                  className="h-14 w-14 shrink-0 rounded-lg border border-border bg-zinc-100 bg-contain bg-center bg-no-repeat dark:bg-zinc-800"
                  style={{ backgroundImage: `url(${plan.imageUrl})` }}
                  role="img"
                  aria-label=""
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pt-0.5 pl-0.5 sm:flex-nowrap sm:gap-2">
                <span
                  className={`inline-block min-w-0 max-w-full shrink-0 break-words rounded-full px-3 py-1 text-sm font-semibold sm:max-w-[14rem] sm:truncate ${getPriorityOvalClasses(
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
                  {t.planStatus[plan.status as keyof typeof t.planStatus] ?? plan.status}
                </span>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5"
                  title={`${plan.percentCompleted}%`}
                  aria-label={`${plan.percentCompleted}% complete`}
                >
                  <span className="h-2 w-12 overflow-hidden rounded-full bg-blue-100">
                    <span
                      className="block h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${plan.percentCompleted}%` }}
                    />
                  </span>
                  <span className="text-xs font-medium text-blue-700 tabular-nums dark:text-blue-300">
                    {plan.percentCompleted}%
                  </span>
                </span>
                {plan.color && hasPlanFlag(plan.color) ? (
                  <span className="shrink-0 text-base leading-none">
                    <PlanFlag color={plan.color} size={18} />
                  </span>
                ) : null}
              </div>
            </div>
            <div className="min-w-0 flex-1 overflow-visible">
                {(plan.goal ?? plan.description) && (
                  <p className="mt-0.5 break-words text-sm text-muted">
                    {(() => {
                      const text = (plan.goal ?? plan.description) as string;
                      return text.length > 500 ? text.slice(0, 500) + "…" : text;
                    })()}
                  </p>
                )}
                <div className="pr-28 sm:pr-[20rem]">
                <p className="mt-1 break-words text-xs text-muted">
                  {plan.startAt.toLocaleDateString()} – {plan.endAt.toLocaleDateString()}
                </p>
                <p className="mt-0.5 break-words text-xs text-muted">
                  {formatTasksCount(
                    t.plans.tasksCountZero,
                    t.plans.tasksCountOne,
                    t.plans.tasksCountMany,
                    plan.totalTaskCount,
                    plan.completedTaskCount,
                  )}
                </p>
                {plan.totalTaskCount > 0 ? (
                  <div
                    className="mt-1.5 flex max-w-full flex-wrap items-center gap-0.5"
                    role="img"
                    aria-label={t.plans.tasksCountAria
                      .replace("{{completed}}", String(plan.completedTaskCount))
                      .replace("{{total}}", String(plan.totalTaskCount))}
                  >
                    {(() => {
                      const total = plan.totalTaskCount;
                      const completed = plan.completedTaskCount;
                      const maxSegments = 100;
                      if (total <= maxSegments) {
                        return (
                          <>
                            {Array.from({ length: total }, (_, i) => (
                              <span
                                key={i}
                                className={`h-2 w-2 shrink-0 rounded-sm ${
                                  i < completed ? "bg-emerald-500 dark:bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-600"
                                }`}
                                aria-hidden
                              />
                            ))}
                          </>
                        );
                      }
                      const showSegments = maxSegments;
                      const completedScaled = Math.round((completed / total) * showSegments);
                      return (
                        <>
                          {Array.from({ length: showSegments }, (_, i) => (
                            <span
                              key={i}
                              className={`h-2 w-2 shrink-0 rounded-sm ${
                                i < completedScaled ? "bg-emerald-500 dark:bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-600"
                              }`}
                              aria-hidden
                            />
                          ))}
                          <span className="ml-0.5 text-xs text-zinc-400 dark:text-zinc-500" aria-hidden>
                            +{total - maxSegments}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                ) : null}
                </div>
              </div>
          </Link>
          {plan.userId === userId ? (
            <div className="absolute bottom-4 right-6 flex items-center gap-2">
              <div className="hidden sm:block">
                <PlanStatusSelect planId={plan.id} currentStatus={plan.status} action={updatePlanStatus} />
              </div>
              {addTaskAction ? (
                <AddTaskDialog action={addTaskAction} plans={plansForDropdown} defaultPlanId={plan.id} />
              ) : null}
              <Link
                href={`/plans/${plan.id}`}
                prefetch={false}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-400 bg-rose-200 text-sm text-rose-900 transition hover:bg-rose-300 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-800/50 max-sm:h-10 max-sm:w-10 max-sm:p-0 sm:px-3 sm:py-2"
              >
                <Pencil className="h-5 w-5 sm:hidden" strokeWidth={2.5} aria-hidden />
                <span className="sr-only sm:not-sr-only">{t.plansPage.edit}</span>
              </Link>
            </div>
          ) : (
            <Link
              href={`/plans/${plan.id}`}
              prefetch={false}
              className="absolute bottom-4 right-6 shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {t.plansPage.view}
            </Link>
          )}
        </li>
      ))}
      {totalPages > 1 && (
        <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3">
          <span className="text-sm text-muted">
            {t.common.pageOf.replace("{{current}}", String(page)).replace("{{total}}", String(totalPages))}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/plans?page=${page - 1}&limit=${limit}`}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {t.common.previousPage}
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/plans?page=${page + 1}&limit=${limit}`}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {t.common.nextPage}
              </Link>
            ) : null}
          </div>
        </li>
      )}
    </ul>
  );
}
