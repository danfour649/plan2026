import type { Metadata } from "next";
import Link from "next/link";

import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { RECENT_UPDATES } from "@/lib/recent-updates.generated";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-blue-950 dark:text-zinc-100">{t.about.title}</h1>
        </div>

        <div className="space-y-4 px-6 py-6">
          <p className="text-lg font-medium text-blue-950 dark:text-zinc-100">{t.about.appName}</p>
          <p className="text-sm text-tertiary">
            {t.about.versionLabel}: {APP_VERSION}
          </p>
          <p className="text-sm text-secondary">{t.about.contributorsIntro}</p>
          <p className="text-sm">
            <Link
              href="https://github.com/danfour649/plan2026"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
            >
              GitHub
            </Link>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-950 dark:text-zinc-100">{t.about.recentUpdatesTitle}</h2>
        </div>
        <div className="max-h-[28rem] overflow-y-auto px-6 py-4">
          <ul className="space-y-4">
            {RECENT_UPDATES.map(({ version, entries }) => (
              <li key={version}>
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">{version}</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-secondary">
                  {entries.map((entry, i) => (
                    <li key={i}>{entry}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
