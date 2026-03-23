import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { getServerAuthSession } from "@/auth";
import { AppNavBar } from "@/components/AppNavBar";
import { HeaderRightNav } from "@/components/HeaderRightNav";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { TranslationsProvider } from "@/components/TranslationsProvider";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";

function AppLayoutFallback() {
  return (
    <div className="min-h-screen bg-transparent text-zinc-950 dark:text-zinc-100" aria-hidden>
      <header className="relative z-50 border-b border-border bg-white/85 backdrop-blur dark:bg-zinc-900/90">
        <div className="mx-auto flex h-[52px] w-full max-w-6xl items-center px-2 sm:h-14 sm:px-8">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-blue-100/80 dark:bg-zinc-700" />
          <div className="ml-4 flex gap-2">
            <div className="h-8 w-16 animate-pulse rounded-full bg-blue-50 dark:bg-zinc-800" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-blue-50 dark:bg-zinc-800" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-blue-50 dark:bg-zinc-800" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 sm:px-8 sm:py-10">
        <div className="h-40 animate-pulse rounded-2xl bg-blue-50/60 dark:bg-zinc-800/60" />
      </main>
    </div>
  );
}

async function AppLayoutInner({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  return (
    <TranslationsProvider locale={locale}>
      <div className="min-h-screen bg-transparent text-zinc-950 dark:text-zinc-100">
        <header className="relative z-50 border-b border-border bg-white/85 backdrop-blur dark:bg-zinc-900/90">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-2 py-2 sm:px-8 sm:py-3">
            <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3 overflow-visible sm:gap-8">
              <Plan2026Logo
                href="/actions"
                className="shrink-0 origin-left -translate-y-1 scale-[1.2] self-center mt-1 sm:translate-y-1 sm:origin-center sm:scale-100 sm:-mt-2.5"
                iconClassName="h-10 w-12 sm:h-16 sm:w-24"
                ariaLabel={t.common.goToActions}
              />
              <AppNavBar
                initialCounts={{ remainingTaskCount: 0, activePlanCount: 0, suppliesCount: 0 }}
                labels={{ plans: t.nav.plans, tasks: t.nav.tasks, supplies: t.nav.supplies }}
              />
            </div>

            <HeaderRightNav />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 sm:px-8 sm:py-10 dark:text-zinc-200">
          {children}
        </main>
      </div>
    </TranslationsProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppLayoutFallback />}>
      <AppLayoutInner>{children}</AppLayoutInner>
    </Suspense>
  );
}
