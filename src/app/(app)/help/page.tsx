import type { Metadata } from "next";

import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Help",
};

export default async function HelpPage() {
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="border-b border-blue-100 px-6 py-4 dark:border-zinc-700">
          <h1 className="text-lg font-semibold text-blue-950 dark:text-zinc-100">{t.help.title}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.help.howToUse}</p>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div>
            <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.help.howToTasksTitle}</h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{t.help.howToTasks}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.help.howToPlansTitle}</h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{t.help.howToPlans}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
