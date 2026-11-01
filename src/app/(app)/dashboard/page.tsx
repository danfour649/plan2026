import Link from "next/link";

import { getCurrentUserId, getServerAuthSession } from "@/auth";
import { ProgressDial } from "@/components/ProgressDial";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getCachedPlansPage } from "@/lib/data-cache";
import { getDashboardTaskStats, summarizePlans } from "@/lib/dashboard";
import {
  formatShortDate,
  formatShortDateOnly,
  getStatusPillClasses,
  intlLocaleTagForAppLocale,
} from "@/lib/format";
import { formatTasksCount, getTranslations } from "@/lib/i18n";

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-blue-50/60 px-4 py-3 dark:bg-zinc-800/60">
      <p className="text-2xl font-semibold tabular-nums text-blue-950 dark:text-zinc-50">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const session = await getServerAuthSession();
  const displayName = session?.user?.name?.trim().split(/\s+/)[0] ?? null;

  const [{ activePlans }, stats] = await Promise.all([
    getCachedPlansPage(userId, 1, 100),
    getDashboardTaskStats(userId),
  ]);
  const summary = summarizePlans(activePlans);
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-950 dark:text-zinc-50">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {displayName
              ? t.dashboard.greeting.replace("{{name}}", displayName)
              : t.dashboard.overviewTitle}
            {" · "}
            {now.toLocaleDateString(intlLocaleTagForAppLocale(locale), {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/plans/new"
          prefetch={false}
          className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {t.dashboard.createPlan}
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="flex flex-col items-center gap-6 px-6 py-6 sm:flex-row sm:gap-8 sm:px-8">
          <ProgressDial
            value={summary.overallPercent}
            size={168}
            strokeWidth={14}
            ariaLabel={t.dashboard.percentCompleteAria.replace(
              "{{percent}}",
              String(summary.overallPercent),
            )}
            caption={t.dashboard.overallLabel}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100">
              {t.dashboard.overviewTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t.dashboard.overallSummary
                .replace("{{completed}}", String(summary.completedTasks))
                .replace("{{total}}", String(summary.totalTasks))
                .replace("{{plans}}", String(summary.activePlans))}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile value={summary.activePlans} label={t.dashboard.activePlans} />
              <StatTile value={summary.remainingTasks} label={t.dashboard.tasksRemaining} />
              <StatTile value={stats.completedLast7Days} label={t.dashboard.completedLast7Days} />
              <StatTile value={stats.dueNext7Days} label={t.dashboard.dueNext7Days} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-blue-950 dark:text-zinc-100">
            {t.dashboard.yourPlans}
          </h2>
          <Link
            href="/plans"
            prefetch={false}
            className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            {t.dashboard.viewAllPlans}
          </Link>
        </div>
        {activePlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white/90 px-6 py-16 text-center shadow-sm dark:bg-zinc-900/90">
            <p className="text-4xl font-light text-blue-300 dark:text-blue-500" aria-hidden>
              📋
            </p>
            <p className="mt-3 text-base font-medium text-blue-900 dark:text-zinc-100">
              {t.dashboard.noPlansTitle}
            </p>
            <p className="mt-1 text-sm text-muted">{t.dashboard.noPlansDescription}</p>
            <Link
              href="/plans/new"
              prefetch={false}
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t.dashboard.createPlan}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePlans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/plans/${plan.id}`}
                  prefetch={false}
                  className="flex h-full items-center gap-4 rounded-2xl border border-border bg-white/90 p-5 shadow-sm shadow-blue-100/40 backdrop-blur transition hover:border-blue-300 hover:shadow dark:bg-zinc-900/90 dark:shadow-zinc-950/40 dark:hover:border-zinc-600"
                >
                  <ProgressDial
                    value={plan.percentCompleted}
                    size={92}
                    strokeWidth={9}
                    ariaLabel={t.dashboard.percentCompleteAria.replace(
                      "{{percent}}",
                      String(plan.percentCompleted),
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-blue-950 dark:text-zinc-50">
                      {plan.name}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusPillClasses(plan.status)}`}
                    >
                      {t.planStatus[plan.status as keyof typeof t.planStatus] ?? plan.status}
                    </span>
                    <p className="mt-2 text-xs text-muted">
                      {formatTasksCount(
                        t.plans.tasksCountZero,
                        t.plans.tasksCountOne,
                        t.plans.tasksCountMany,
                        plan.totalTaskCount,
                        plan.completedTaskCount,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatShortDate(plan.startAt, locale)} – {formatShortDate(plan.endAt, locale)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <h2 className="border-b border-border px-6 py-4 text-lg font-semibold tracking-tight text-blue-950 dark:text-zinc-100">
          {t.dashboard.upNext}
        </h2>
        {stats.upcoming.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">{t.dashboard.noUpcoming}</p>
        ) : (
          <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
            {stats.upcoming.map((task) => {
              const overdue = task.dueAt < now;
              return (
                <li key={task.id}>
                  <Link
                    href="/tasks"
                    prefetch={false}
                    className="flex items-center justify-between gap-3 px-6 py-3 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-blue-950 dark:text-zinc-100">
                        {task.title}
                      </span>
                      {task.planName ? (
                        <span className="mt-0.5 block truncate text-xs text-muted">{task.planName}</span>
                      ) : null}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-medium tabular-nums ${
                        overdue ? "text-rose-600 dark:text-rose-400" : "text-muted"
                      }`}
                    >
                      {overdue ? `${t.dashboard.overdue} · ` : ""}
                      {formatShortDateOnly(task.dueAt, locale)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
