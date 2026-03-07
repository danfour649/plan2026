"use client";

import { useRouter } from "next/navigation";

import { useTranslations } from "@/components/TranslationsProvider";

type ShowCompletedToggleProps = {
  showCompleted: boolean;
};

export function ShowCompletedToggle({ showCompleted }: ShowCompletedToggleProps) {
  const t = useTranslations();
  const router = useRouter();
  const activeOnly = !showCompleted;

  function handleToggle() {
    router.push(showCompleted ? "/tasks" : "/tasks?showCompleted=1");
  }

  return (
    <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-2">
      <span className="order-2 text-xs text-zinc-600 sm:order-1 sm:text-sm sm:font-medium sm:text-zinc-700" aria-hidden>{t.toggle.active}</span>
      <button
        type="button"
        role="switch"
        aria-checked={activeOnly}
        aria-label={
          activeOnly
            ? t.toggle.showActiveTasksOnly
            : t.toggle.includeCompletedTasks
        }
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border shadow-inner transition-colors hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1 ${
          activeOnly ? "border-blue-400 bg-blue-50" : "border-blue-200 bg-white"
        }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-blue-500 shadow-sm transition-transform ${
            activeOnly ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
