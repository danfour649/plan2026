"use client";

import { useTranslations } from "@/components/TranslationsProvider";

export function PrintChecklistActions() {
  const t = useTranslations();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-orange-200/90 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-950 transition hover:bg-orange-100 dark:border-orange-800/70 dark:bg-orange-950/50 dark:text-orange-100 dark:hover:bg-orange-900/50"
      aria-label={t.plans.printChecklistAria}
    >
      {t.plans.printChecklist}
    </button>
  );
}
