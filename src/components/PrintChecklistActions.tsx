"use client";

import { useTranslations } from "@/components/TranslationsProvider";

export function PrintChecklistActions() {
  const t = useTranslations();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-blue-200 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      aria-label={t.plans.printChecklistAria}
    >
      {t.plans.printChecklist}
    </button>
  );
}
