import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getCurrentUserId } from "@/auth";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { PrintChecklistActions } from "@/components/PrintChecklistActions";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "pidgin" ? "en-GB" : "en-US", {
    dateStyle: "medium",
  });
}

function formatTime(d: Date, locale: string): string {
  return d.toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PlanPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);
  const { id } = await params;

  const plan = await prisma.plan.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { shares: { some: { sharedWithUserId: userId } } },
      ],
    },
    include: {
      tasks: {
        select: {
          id: true,
          title: true,
          content: true,
          dueAt: true,
          urgency: true,
          completedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!plan) notFound();

  const unfinishedTasks = plan.tasks
    .filter((task) => task.completedAt == null)
    .sort((a, b) => {
      if (a.urgency !== b.urgency) return b.urgency - a.urgency;
      if (a.dueAt == null && b.dueAt == null) return 0;
      if (a.dueAt == null) return 1;
      if (b.dueAt == null) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

  const completedTasks = plan.tasks
    .filter((task) => task.completedAt != null)
    .sort((a, b) => {
      const aAt = a.completedAt!.getTime();
      const bAt = b.completedAt!.getTime();
      return bAt - aAt;
    });

  const now = new Date();
  const printedDate = formatDate(now, locale);
  const printedTime = formatTime(now, locale);
  const planStart = formatDate(plan.startAt, locale);
  const planEnd = formatDate(plan.endAt, locale);
  const statusLabel = t.planStatus[plan.status as keyof typeof t.planStatus] ?? plan.status;
  const completedCount = completedTasks.length;
  const totalCount = plan.tasks.length;
  const progressLabel =
    totalCount === 0
      ? "0"
      : totalCount === 1
        ? t.plans.tasksCountOne.replace("{{completed}}", String(completedCount)).replace("{{total}}", "1")
        : t.plans.tasksCountMany.replace("{{completed}}", String(completedCount)).replace("{{total}}", String(totalCount));

  return (
    <div id="print-checklist-root" className="mx-auto max-w-2xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print {
            body * { visibility: hidden; }
            #print-checklist-root, #print-checklist-root * { visibility: visible; }
            #print-checklist-root { position: absolute; left: 0; top: 0; width: 100%; }
            #print-checklist-root .no-print { display: none !important; }
          }`,
        }}
      />
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <PrintChecklistActions />
        <Link
          href={`/plans/${id}`}
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
        >
          {t.common.backToPlan}
        </Link>
      </div>

      <div className="print:mt-0 space-y-6">
        <header className="border-b border-zinc-200 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">{plan.name}</h1>
          <p className="mt-1 text-sm font-medium text-zinc-600">{t.plans.printReportTitle}</p>
          {(plan.description ?? plan.goal) && (() => {
            const summary = stripHtml((plan.description ?? plan.goal) ?? "");
            return summary ? (
              <p className="mt-2 text-sm text-zinc-600">
                {summary.slice(0, 200)}
                {summary.length > 200 ? "…" : ""}
              </p>
            ) : null;
          })()}
          <dl className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2 sm:gap-x-4">
            <div>
              <dt className="font-medium text-zinc-500">{t.plans.printPlanPeriod}</dt>
              <dd className="text-zinc-800">{planStart} – {planEnd}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">{t.plans.printPlanStatus}</dt>
              <dd className="text-zinc-800">{statusLabel}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">{t.plans.printPlanProgress}</dt>
              <dd className="text-zinc-800">{progressLabel}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-zinc-500">
            {t.plans.printReportPrintedAt.replace("{{date}}", printedDate).replace("{{time}}", printedTime)}
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-blue-950">
            {t.plans.printSectionUnfinished}
          </h2>
          {unfinishedTasks.length > 0 ? (
            <ul className="mt-3 list-none space-y-2 pl-0">
              {unfinishedTasks.map((task) => (
                <li key={task.id} className="flex flex-col gap-0.5 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-mono text-zinc-400" aria-hidden>
                      ☐
                    </span>
                    <span className="min-w-0 flex-1 break-words font-medium">{task.title}</span>
                  </div>
                  <div className="ml-5 flex flex-wrap gap-x-3 gap-y-0 text-xs text-zinc-500">
                    <span>
                      {t.plans.printTaskPriority}: {task.urgency}
                    </span>
                    {task.dueAt && (
                      <span>{t.plans.printTaskDue.replace("{{date}}", formatDate(task.dueAt, locale))}</span>
                    )}
                  </div>
                  {task.content && stripHtml(task.content).length > 0 && (
                    <p className="ml-5 mt-0.5 text-xs text-zinc-500 line-clamp-2">
                      {stripHtml(task.content).slice(0, 120)}
                      {stripHtml(task.content).length > 120 ? "…" : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">{t.plans.printNoUnfinished}</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-blue-950">
            {t.plans.printSectionCompleted}
          </h2>
          {completedTasks.length > 0 ? (
            <ul className="mt-3 list-none space-y-2 pl-0">
              {completedTasks.map((task) => (
                <li key={task.id} className="flex flex-col gap-0.5 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 font-mono text-emerald-600" aria-hidden>
                      ☑
                    </span>
                    <span className="min-w-0 flex-1 break-words font-medium text-zinc-700 line-through">
                      {task.title}
                    </span>
                  </div>
                  <div className="ml-5 flex flex-wrap gap-x-3 gap-y-0 text-xs text-zinc-500">
                    <span>
                      {t.plans.printTaskCompleted.replace(
                        "{{date}}",
                        formatDate(task.completedAt!, locale),
                      )}
                    </span>
                    {task.dueAt && (
                      <span>{t.plans.printTaskDue.replace("{{date}}", formatDate(task.dueAt, locale))}</span>
                    )}
                  </div>
                  {task.content && stripHtml(task.content).length > 0 && (
                    <p className="ml-5 mt-0.5 text-xs text-zinc-500 line-clamp-2">
                      {stripHtml(task.content).slice(0, 120)}
                      {stripHtml(task.content).length > 120 ? "…" : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">{t.plans.printNoCompleted}</p>
          )}
        </section>
      </div>
    </div>
  );
}
