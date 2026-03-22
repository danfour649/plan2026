"use client";

import { useRouter } from "next/navigation";

import { useTranslations } from "@/components/TranslationsProvider";

type ShowArchivedPlansToggleProps = {
  showArchived: boolean;
};

export function ShowArchivedPlansToggle({ showArchived }: ShowArchivedPlansToggleProps) {
  const t = useTranslations();
  const router = useRouter();

  function handleToggle() {
    router.push(showArchived ? "/plans?showArchived=0" : "/plans?showArchived=1");
  }

  const activeOnly = !showArchived;
  return (
    <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-2">
      <span className="order-2 text-xs text-zinc-600 sm:order-1 sm:text-sm sm:font-medium sm:text-zinc-700" aria-hidden>{t.toggle.active}</span>
      <button
        type="button"
        role="switch"
        aria-checked={activeOnly}
        aria-label={
          activeOnly
            ? t.toggle.showActivePlansOnly
            : t.toggle.includeArchivedPlans
        }
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-zinc-900 ${
          activeOnly
            ? "border-blue-600 bg-blue-500 hover:border-blue-500 dark:border-blue-500 dark:bg-blue-600"
            : "border-red-600 bg-red-500 hover:border-red-500 dark:border-red-600 dark:bg-red-600"
        }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform dark:ring-white/15 ${
            activeOnly ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
