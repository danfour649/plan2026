import Link from "next/link";

import { cookies } from "next/headers";

import { Plan2026Logo } from "@/components/Plan2026Logo";
import { SharePageTaskRow } from "@/components/SharePageTaskRow";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { formatShortDateOnly } from "@/lib/format";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);

  const link = await prisma.planShareLink.findUnique({
    where: { token },
    include: {
      plan: {
        include: {
          tasks: {
            orderBy: [
              { completedAt: "desc" as const },
              { urgency: "desc" as const },
              { createdAt: "desc" as const },
            ],
            select: {
              id: true,
              title: true,
              completedAt: true,
            },
          },
        },
      },
    },
  });

  const invalidOrExpired = !link || (link.expiresAt != null && link.expiresAt < new Date());
  if (invalidOrExpired) {
    return (
      <main className="min-h-screen px-6 py-16 text-zinc-950">
        <div className="mx-auto max-w-md rounded-2xl border border-blue-100 bg-white/90 p-8 shadow-sm backdrop-blur">
          <Plan2026Logo className="mb-6" iconClassName="h-16 w-20" ariaLabel={t.common.goToPlans} />
          <h1 className="text-xl font-semibold text-blue-950">{t.sharePage.linkExpired}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t.sharePage.linkExpiredDescription}</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.invite.signIn}
          </Link>
        </div>
      </main>
    );
  }

  const plan = link.plan;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-lg">
        <Plan2026Logo
          className="mb-6"
          iconClassName="h-12 w-14"
          ariaLabel={t.common.goToPlans}
        />
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold text-blue-950">{t.sharePage.title}</h1>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            {t.sharePage.planLabel}: {plan.name}
          </p>
          {plan.goal ? (
            <p className="mt-2 text-sm text-zinc-600">
              <span className="font-medium text-zinc-700">{t.sharePage.goalLabel}:</span>{" "}
              {plan.goal}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500">
            {plan.startAt ? formatShortDateOnly(plan.startAt) : ""}
            {plan.startAt && plan.endAt ? " – " : ""}
            {plan.endAt ? formatShortDateOnly(plan.endAt) : ""}
          </p>

          <section className="mt-6" aria-label={t.sharePage.tasksLabel}>
            <h2 className="text-sm font-medium text-zinc-700">{t.sharePage.tasksLabel}</h2>
            <ul className="mt-2 space-y-2">
              {plan.tasks.length === 0 ? (
                <li className="rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-center text-sm text-zinc-500">
                  {t.sharePage.noTasks}
                </li>
              ) : (
                plan.tasks.map((task) => (
                  <SharePageTaskRow
                    key={task.id}
                    token={token}
                    taskId={task.id}
                    completedAt={task.completedAt}
                    allowStatusUpdate={link.allowStatusUpdate}
                    title={task.title}
                    markDoneLabel={t.sharePage.markDone}
                    restoreLabel={t.sharePage.restore}
                  />
                ))
              )}
            </ul>
          </section>

          <p className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              {t.sharePage.signInToManage}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
