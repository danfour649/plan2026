"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTranslations } from "@/components/TranslationsProvider";

export function RefreshPlansButton() {
  const t = useTranslations();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setRefreshing(true);
        router.refresh();
        setTimeout(() => setRefreshing(false), 600);
      }}
      disabled={refreshing}
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-green-300 bg-green-200 text-green-800 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-green-700 dark:bg-green-800/50 dark:text-green-200 dark:hover:bg-green-700/60"
      title={t.calendar.reloadPlans}
      aria-label={t.calendar.reloadPlans}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
        aria-hidden="true"
      >
        <path
          d="M16.25 10A6.25 6.25 0 1 1 14.42 5.58"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M13.75 3.75H16.25V6.25"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-md bg-zinc-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition group-hover:opacity-100">
        {refreshing ? t.common.refreshing : t.common.reload}
      </span>
    </button>
  );
}
