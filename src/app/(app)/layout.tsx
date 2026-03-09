import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getServerAuthSession } from "@/auth";
import { AppNavLink } from "@/components/AppNavLink";
import { HeaderRightNav } from "@/components/HeaderRightNav";
import { CheckboxIcon, CurrencyIcon, LightbulbIcon } from "@/components/NavIcons";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { TranslationsProvider } from "@/components/TranslationsProvider";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);
  const userId = session.user.id;
  const [remainingTaskCount, activePlanCount, suppliesCount] = await Promise.all([
    prisma.task.count({
      where: { userId, completedAt: null },
    }),
    prisma.plan.count({
      where: {
        userId,
        status: { notIn: ["completed", "abandoned"] },
      },
    }),
    prisma.supplyItem.count({
      where: {
        plan: {
          OR: [
            { userId },
            { shares: { some: { sharedWithUserId: userId } } },
          ],
        },
      },
    }),
  ]);

  return (
    <TranslationsProvider locale={locale}>
      <div className="min-h-screen bg-transparent text-zinc-950">
        <header className="relative z-50 border-b border-blue-100 bg-white/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-2 py-2 sm:px-6 sm:py-3">
            <div className="relative z-10 flex min-w-0 flex-1 items-center gap-1 overflow-visible sm:gap-6">
              <Plan2026Logo
                className="shrink-0 self-center mt-2 sm:-mt-2.5"
                iconClassName="h-10 w-12 sm:h-16 sm:w-24"
                ariaLabel={t.common.goToPlans}
              />
              <nav className="flex min-w-0 shrink items-center gap-0 text-sm text-zinc-700 sm:gap-4">
                <AppNavLink
                  href="/plans"
                  accent="blue"
                  badge={activePlanCount}
                  ariaLabel={t.nav.plans}
                  className="-mx-1.5 shrink-0 gap-0 px-0.5 py-1 text-[11px] sm:mx-0 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <span className="inline-flex mt-1 sm:mt-0 sm:hidden">
                    <LightbulbIcon className="h-11 w-11" />
                  </span>
                  <span className="hidden sm:inline">{t.nav.plans}</span>
                </AppNavLink>
                <AppNavLink
                  href="/tasks"
                  accent="blue"
                  badge={remainingTaskCount}
                  ariaLabel={t.nav.tasks}
                  className="-mx-1.5 shrink-0 gap-0 px-0.5 py-1 text-[11px] sm:mx-0 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <span className="inline-flex mt-1 sm:mt-0 sm:hidden">
                    <CheckboxIcon className="h-11 w-11" />
                  </span>
                  <span className="hidden sm:inline">{t.nav.tasks}</span>
                </AppNavLink>
                <AppNavLink
                  href="/supplies"
                  accent="blue"
                  badge={suppliesCount > 0 ? suppliesCount : undefined}
                  ariaLabel={t.nav.supplies}
                  className="-ml-2 -mx-1.5 shrink-0 gap-0 px-0.5 py-1 text-[11px] sm:ml-0 sm:mx-0 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  <span className="inline-flex mt-1 sm:mt-0 sm:hidden">
                    <CurrencyIcon className="h-11 w-11" />
                  </span>
                  <span className="hidden sm:inline">{t.nav.supplies}</span>
                </AppNavLink>
              </nav>
            </div>

            <HeaderRightNav userEmail={session?.user?.email} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
    </TranslationsProvider>
  );
}

