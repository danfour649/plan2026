import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Help",
};

export default async function HelpPage() {
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="border-b border-blue-100 px-6 py-4">
          <h1 className="text-lg font-semibold text-blue-950">{t.help.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t.help.howToUse}</p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div>
            <h2 className="text-sm font-semibold text-blue-950">{t.help.howToTasksTitle}</h2>
            <p className="mt-2 text-sm text-zinc-700">{t.help.howToTasks}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-blue-950">{t.help.howToPlansTitle}</h2>
            <p className="mt-2 text-sm text-zinc-700">{t.help.howToPlans}</p>
          </div>

          <div className="border-t border-blue-100 pt-6">
            <h2 className="text-sm font-semibold text-blue-950">{t.help.versionHistoryTitle}</h2>
            <p className="mt-2 text-sm text-zinc-600">{t.help.versionHistoryIntro}</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-700">
              <li>Data handling optimizations, task/plan APIs, pagination</li>
              <li>Print checklist from plan</li>
              <li>Discard-changes confirmation, Flag (color) in UI</li>
              <li>Mobile improvements, progress bar, Pidgin &quot;Work&quot;</li>
            </ul>
            <p className="mt-3">
              <Link
                href="https://github.com/danfour649/plan2026/blob/main/CHANGELOG.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
              >
                {t.help.viewFullChangelog}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
