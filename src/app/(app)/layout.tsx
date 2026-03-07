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
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
            <Plan2026Logo
              className="-mt-4 mb-1"
              iconClassName="h-12 w-16"
              ariaLabel={t.common.goToPlans}
            />
              <nav className="flex items-center gap-4 text-sm text-zinc-700">
                <AppNavLink href="/plans" accent="blue" badge={activePlanCount}>
                  {t.nav.plans}
                </AppNavLink>
                <AppNavLink href="/tasks" accent="blue" badge={remainingTaskCount}>
                  {t.nav.tasks}
                </AppNavLink>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <AppNavLink
                href="/settings"
                accent="blue"
                ariaLabel={t.nav.settings}
                className="px-2.5 py-2"
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

