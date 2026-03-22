import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";
import { ExportPlansButton } from "@/components/ExportPlansButton";
import { RefreshPlansButton } from "@/components/RefreshPlansButton";
import { ShowArchivedPlansToggle } from "@/components/ShowArchivedPlansToggle";
import { SyncPlansListFilterCookie } from "@/components/SyncListFilterPreferenceCookies";
import { PlanStatusSelect } from "@/components/PlanStatusSelect";
import { PlanFlag } from "@/components/PlanFlag";
import { hasPlanFlag } from "@/lib/plan-flags";
import {
  getPriorityOvalClasses,
  getStatusPillClasses,
} from "@/lib/format";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { formatTasksCount, getTranslations } from "@/lib/i18n";
import { getCachedPlansPage } from "@/lib/data-cache";
import type { ExportedPlan } from "@/lib/export";
import { updatePlanStatus } from "@/lib/actions/plans";
import {
  PLANS_SHOW_ARCHIVED_COOKIE,
  readPlansShowArchivedFromCookie,
} from "@/lib/list-filter-preferences";

function plansShowArchivedFromSearchParams(
  raw: string | string[] | undefined,
): boolean | null {
  if (raw === undefined) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined || v === "") return null;
  return v === "1";
}

const DEFAULT_PLANS_PAGE_SIZE = 20;
const MAX_PLANS_PAGE_SIZE = 100;

function parsePage(value: string | string[] | undefined): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? "1"), 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function parseLimit(value: string | string[] | undefined, defaultSize: number): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? defaultSize), 10);
  if (Number.isNaN(n) || n < 1) return defaultSize;
  return Math.min(n, MAX_PLANS_PAGE_SIZE);
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams?: Promise<{
    showArchived?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const fromUrl = plansShowArchivedFromSearchParams(resolvedSearchParams.showArchived);
  const cookieStore = await cookies();
  const fromCookie = readPlansShowArchivedFromCookie(
    cookieStore.get(PLANS_SHOW_ARCHIVED_COOKIE)?.value,
  );
  const showArchived = fromUrl !== null ? fromUrl : fromCookie;
  const page = parsePage(resolvedSearchParams.page);
  const limit = parseLimit(resolvedSearchParams.limit, DEFAULT_PLANS_PAGE_SIZE);

  const { plans, totalPlans } = await getCachedPlansPage(
    userId,
    showArchived,
    page,
    limit,
  );
  const totalPages = Math.ceil(totalPlans / limit) || 1;

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
      status: t.status,
    })),
  }));

  return (
    <div className="space-y-8">
      <SyncPlansListFilterCookie showArchived={showArchived} />
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-6 py-4 dark:border-zinc-700 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.plansPage.title}</h2>
            <div className="flex shrink-0 items-center gap-1">
              <RefreshPlansButton />
              <ExportPlansButton
                plans={plansForExport}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-0 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              />
            </div>
          </div>
          <div className="ml-auto flex flex-nowrap items-center gap-2 sm:gap-4">
            <ShowArchivedPlansToggle showArchived={showArchived} />
            <Link
              href="/plans/new"
              prefetch={false}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 sm:h-auto sm:w-fit sm:px-4 sm:py-2"
              aria-label={t.plans.addPlanAria}
            >
              <span className="text-xl font-medium sm:hidden" aria-hidden>+</span>
              <span className="hidden text-sm font-medium sm:inline">{t.plansPage.addPlan}</span>
            </Link>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-4xl font-light text-blue-300 dark:text-blue-500" aria-hidden>
              📋
            </p>
            <p className="mt-3 text-base font-medium text-blue-900 dark:text-zinc-100">{t.plansPage.noPlans}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t.plansPage.createPlan}</p>
            <Link
              href="/plans/new"
              prefetch={false}
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t.plansPage.addPlan}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-col gap-3 px-6 py-4 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 sm:flex-row sm:items-end sm:justify-between sm:gap-3"
              >
                <Link
                  href={`/plans/${plan.id}`}
                  prefetch={false}
                  className="flex min-w-0 flex-1 flex-col gap-2"
                >
                  {/* Row 1 (sm): name + status + % + flag on one line; name above image when image present */}
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
                  {/* Row 2: image (if any) + description, dates, task count, dots */}
                  <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3 sm:flex-nowrap sm:items-start">
                    {plan.imageUrl ? (
                      <div
                        className="h-14 w-14 shrink-0 rounded-lg border border-blue-100 bg-zinc-100 bg-contain bg-center bg-no-repeat dark:border-zinc-600 dark:bg-zinc-800"
                        style={{ backgroundImage: `url(${plan.imageUrl})` }}
                        role="img"
                        aria-label=""
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 overflow-visible">
                      {(plan.goal ?? plan.description) && (
                        <p className="mt-0.5 line-clamp-2 break-words text-sm text-zinc-500 dark:text-zinc-400 sm:line-clamp-1">
                          {plan.goal ?? plan.description}
                        </p>
                      )}
                      <p className="mt-1 break-words text-xs text-zinc-500 dark:text-zinc-400">
                        {plan.startAt.toLocaleDateString()} – {plan.endAt.toLocaleDateString()}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-zinc-500">
                        {formatTasksCount(
                          t.plans.tasksCountZero,
                          t.plans.tasksCountOne,
                          t.plans.tasksCountMany,
                          plan.tasks.length,
                          plan.tasks.filter((task) => task.status === "completed").length,
                        )}
                      </p>
                      {plan.tasks.length > 0 ? (
                        <div
                          className="mt-1.5 flex max-w-full flex-wrap items-center gap-0.5"
                          role="img"
                          aria-label={t.plans.tasksCountAria
                            .replace("{{completed}}", String(plan.tasks.filter((t) => t.status === "completed").length))
                            .replace("{{total}}", String(plan.tasks.length))}
                        >
                          {(() => {
                            const total = plan.tasks.length;
                            const completed = plan.tasks.filter((t) => t.status === "completed").length;
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
                      prefetch={false}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
                    >
                      {t.plansPage.edit}
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/plans/${plan.id}`}
                    prefetch={false}
                    className="shrink-0 self-end rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 sm:self-auto"
                  >
                    {t.plansPage.view}
                  </Link>
                )}
              </li>
            ))}
            {totalPages > 1 && (
              <li className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 px-6 py-3 dark:border-zinc-700">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t.common.pageOf.replace("{{current}}", String(page)).replace("{{total}}", String(totalPages))}
                </span>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link
                      href={`/plans?page=${page - 1}&limit=${limit}${showArchived ? "&showArchived=1" : ""}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.previousPage}
                    </Link>
                  ) : null}
                  {page < totalPages ? (
                    <Link
                      href={`/plans?page=${page + 1}&limit=${limit}${showArchived ? "&showArchived=1" : ""}`}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      {t.common.nextPage}
                    </Link>
                  ) : null}
                </div>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
