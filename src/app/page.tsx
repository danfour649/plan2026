import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Plan 2026",
  description:
    "Plan 2026 is a planning and task-management web app. Organize tasks and plans, share with others, and optionally add due dates to Google Calendar.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage() {
  const session = await getServerAuthSession();
  if (session?.user) redirect("/tasks");

  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);

  return (
    <PublicPageShell locale={locale}>
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-white/90 p-6 shadow-sm shadow-blue-100/60 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40 sm:p-8">
          <Plan2026Logo
            className="mb-6 sm:mb-8"
            iconClassName="h-16 w-20 sm:h-20 sm:w-24"
            ariaLabel={t.home.appName}
          />
          <h1 className="text-2xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100 sm:text-3xl">
            {t.home.appName}
          </h1>
          <p className="mt-2 text-base font-medium text-secondary">{t.home.tagline}</p>
          <p className="mt-4 text-sm text-secondary">{t.home.description}</p>
          <ul className="mt-5 list-inside list-disc space-y-1.5 text-sm text-secondary">
            <li>{t.login.benefit1}</li>
            <li>{t.login.benefit2}</li>
            <li>{t.login.benefit3}</li>
          </ul>
          <p className="mt-6">
            <Link
              href="/login"
              className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t.home.signIn}
            </Link>
          </p>
          <p className="mt-4 text-xs text-tertiary">{t.home.operatedBy}</p>
        </div>
      </main>
    </PublicPageShell>
  );
}
