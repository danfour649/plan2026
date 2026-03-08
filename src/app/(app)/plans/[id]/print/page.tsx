import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getCurrentUserId } from "@/auth";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { PrintChecklistActions } from "@/components/PrintChecklistActions";

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
        select: { id: true, title: true, dueAt: true, urgency: true, completedAt: true },
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

  const printedDate = new Date().toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "pidgin" ? "en-GB" : "en-US", {
    dateStyle: "long",
  });

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
          href="/plans"
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
        >
          {t.common.backToPlans}
        </Link>
      </div>
      <div className="print:mt-0">
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">{plan.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t.plans.printedOn.replace("{{date}}", printedDate)}
        </p>
        {unfinishedTasks.length > 0 ? (
          <ul className="mt-6 list-none space-y-2 pl-0">
            {unfinishedTasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 font-mono text-zinc-400" aria-hidden>
                  ☐
                </span>
                <span className="min-w-0 flex-1 break-words">{task.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">{t.plans.noTasksInPlan}</p>
        )}
      </div>
    </div>
  );
}
