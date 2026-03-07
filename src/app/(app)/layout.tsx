import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getServerAuthSession } from "@/auth";
import { AppNavLink } from "@/components/AppNavLink";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { SignOutButton } from "@/components/SignOutButton";
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
  const remainingTaskCount = await prisma.task.count({
    where: { userId: session.user.id, completedAt: null },
  });
  const activePlanCount = await prisma.plan.count({
    where: {
      userId: session.user.id,
      status: { notIn: ["completed", "abandoned"] },
    },
  });

  return (
    <TranslationsProvider locale={locale}>
      <div className="min-h-screen bg-transparent text-zinc-950">
        <header className="border-b border-blue-100 bg-white/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-2 py-3 sm:px-6 sm:py-4">
            <div className="relative z-10 flex min-w-0 flex-1 items-center gap-1 overflow-visible sm:gap-6">
              <Plan2026Logo
                className="shrink-0 sm:-mt-4 sm:mb-1"
                iconClassName="h-8 w-9 sm:h-12 sm:w-16"
                ariaLabel={t.common.goToPlans}
              />
              <nav className="flex min-w-0 shrink items-center gap-0.5 text-sm text-zinc-700 sm:gap-4">
                <AppNavLink
                  href="/plans"
                  accent="blue"
                  badge={activePlanCount}
                  className="shrink-0 gap-0 px-1.5 py-1 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  {t.nav.plans}
                </AppNavLink>
                <AppNavLink
                  href="/tasks"
                  accent="blue"
                  badge={remainingTaskCount}
                  className="shrink-0 gap-0 px-1.5 py-1 text-[11px] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  {t.nav.tasks}
                </AppNavLink>
              </nav>
            </div>

            <div className="relative z-0 flex shrink-0 items-center justify-end gap-1 pl-2 sm:gap-3 sm:pl-0">
              <AppNavLink
                href="/settings"
                accent="blue"
                ariaLabel={t.nav.settings}
                className="shrink-0 p-1 sm:px-2.5 sm:py-2"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.12-1.57 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.57-1.12 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1.12 1.57 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .68.4 1.3 1.04 1.56H21a2 2 0 0 1 0 4h-.09c-.68 0-1.3.4-1.56 1.04Z" />
                </svg>
              </AppNavLink>
              <span className="hidden text-sm text-zinc-600 md:inline">
                {session?.user?.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
      </div>
    </TranslationsProvider>
  );
}

