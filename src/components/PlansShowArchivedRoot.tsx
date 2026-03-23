"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { ExportPlansButton } from "@/components/ExportPlansButton";
import { useTranslations } from "@/components/TranslationsProvider";
import { postListPrefs } from "@/lib/list-prefs-client";
import type { ExportedPlan } from "@/lib/export";

type PlansArchiveFilterContextValue = {
  showArchived: boolean;
  setShowArchived: (value: boolean) => void;
};

const PlansArchiveFilterContext = createContext<PlansArchiveFilterContextValue | null>(null);

export function usePlansArchiveFilter(): PlansArchiveFilterContextValue {
  const ctx = useContext(PlansArchiveFilterContext);
  if (!ctx) {
    throw new Error("usePlansArchiveFilter must be used inside PlansShowArchivedRoot");
  }
  return ctx;
}

export function PlansShowArchivedRoot({
  initialShowArchived,
  header,
  activeSlot,
  fullSlot,
}: {
  initialShowArchived: boolean;
  header: ReactNode;
  activeSlot: ReactNode;
  fullSlot: ReactNode;
}) {
  const [showArchived, setShowArchivedState] = useState(initialShowArchived);

  useEffect(() => {
    setShowArchivedState(initialShowArchived);
  }, [initialShowArchived]);

  /** User toggles only — avoids POST on mount / Strict Mode / server prop sync. */
  const setShowArchived = useCallback((value: boolean) => {
    setShowArchivedState(value);
    postListPrefs({ plansShowArchived: value });
  }, []);

  return (
    <PlansArchiveFilterContext.Provider value={{ showArchived, setShowArchived }}>
      <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        {header}
        {showArchived ? fullSlot : activeSlot}
      </section>
    </PlansArchiveFilterContext.Provider>
  );
}

export function PlansShowArchivedToggle() {
  const { showArchived, setShowArchived } = usePlansArchiveFilter();
  const t = useTranslations();
  const activeOnly = !showArchived;

  return (
    <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-2">
      <span className="order-2 text-xs text-zinc-600 sm:order-1 sm:text-sm sm:font-medium sm:text-zinc-700" aria-hidden>
        {t.toggle.active}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={activeOnly}
        aria-label={activeOnly ? t.toggle.showActivePlansOnly : t.toggle.includeArchivedPlans}
        onClick={() => setShowArchived(!showArchived)}
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

export function ExportPlansButtonFiltered({
  activePlans,
  fullPlans,
  className,
}: {
  activePlans: ExportedPlan[];
  fullPlans: ExportedPlan[];
  className?: string;
}) {
  const { showArchived } = usePlansArchiveFilter();
  return <ExportPlansButton plans={showArchived ? fullPlans : activePlans} className={className} />;
}
