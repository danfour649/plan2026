import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getServerAuthSession } from "@/auth";
import { AppNavLink } from "@/components/AppNavLink";
import { HeaderRightNav } from "@/components/HeaderRightNav";
import { CheckboxIcon, CurrencyIcon, LightbulbIcon } from "@/components/NavIcons";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { TranslationsProvider } from "@/components/TranslationsProvider";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { getCachedNavCounts } from "@/lib/data-cache";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);
  const { remainingTaskCount, activePlanCount, suppliesCount } =
    await getCachedNavCounts(session.user.id);

  return (
    <TranslationsProvider locale={locale}>
      <div className="min-h-screen bg-transparent text-zinc-950 dark:text-zinc-100">
        <header className="relative z-50 border-b border-blue-100 bg-white/85 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-2 py-2 sm:px-8 sm:py-3">
            <div className="relative z-10 flex min-w-0 flex-1 items-center gap-1 overflow-visible sm:gap-6">
              <Plan2026Logo
                href="/actions"
                className="shrink-0 self-center mt-2 sm:-mt-2.5"
                iconClassName="h-10 w-12 sm:h-16 sm:w-24"
                ariaLabel={t.common.goToActions}
              />
                <nav className="flex min-w-0 shrink items-center gap-0.5 text-sm text-zinc-700 dark:text-zinc-300 sm:gap-4">
                  <div className="flex min-w-0 shrink items-center gap-0.5 sm:gap-2 md:gap-3">
                    <AppNavLink
                      href="/plans"
                      accent="blue"
                      badge={activePlanCount}
                      ariaLabel={t.nav.plans}
                      className="-mx-0.5 shrink-0 gap-0 rounded-lg px-1 py-0.5 text-[11px] sm:mx-0 sm:rounded-full sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm md:text-base"
                    >
                      <span className="inline-flex mt-0.5 sm:mt-0 sm:hidden">
                        <LightbulbIcon className="h-8 w-8" />
                      </span>
                      <span className="hidden sm:inline">{t.nav.plans}</span>
                    </AppNavLink>
                    <AppNavLink
                      href="/tasks"
                      accent="blue"
                      badge={remainingTaskCount}
                      ariaLabel={t.nav.tasks}
                      className="-mx-0.5 shrink-0 gap-0 rounded-lg px-1 py-0.5 text-[11px] sm:mx-0 sm:rounded-full sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm md:text-base"
                    >
                      <span className="inline-flex mt-0.5 sm:mt-0 sm:hidden">
                        <CheckboxIcon className="h-8 w-8" />
                      </span>
                      <span className="hidden sm:inline">{t.nav.tasks}</span>
                    </AppNavLink>
                    <AppNavLink
                      href="/supplies"
                      accent="blue"
                      badge={suppliesCount > 0 ? suppliesCount : undefined}
                      ariaLabel={t.nav.supplies}
                      className="-mx-0.5 shrink-0 gap-0 rounded-lg px-1 py-0.5 text-[11px] sm:ml-0 sm:mx-0 sm:rounded-full sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm md:text-base"
                    >
                      <span className="inline-flex mt-0.5 sm:mt-0 sm:hidden">
                        <CurrencyIcon className="h-8 w-8" />
                      </span>
                      <span className="hidden sm:inline">{t.nav.supplies}</span>
                    </AppNavLink>
                  </div>
                </nav>
            </div>

            <HeaderRightNav />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10 dark:text-zinc-200">{children}</main>
      </div>
    </TranslationsProvider>
  );
}

