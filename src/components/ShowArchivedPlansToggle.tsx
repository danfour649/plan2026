"use client";

import { useRouter } from "next/navigation";

type ShowArchivedPlansToggleProps = {
  showArchived: boolean;
};

export function ShowArchivedPlansToggle({ showArchived }: ShowArchivedPlansToggleProps) {
  const router = useRouter();

  function handleToggle() {
    router.push(showArchived ? "/plans" : "/plans?showArchived=1");
  }

  const activeOnly = !showArchived;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700">Active</span>
      <button
        type="button"
        role="switch"
        aria-checked={activeOnly}
        aria-label={
          activeOnly
            ? "Show only active plans (turn off to include completed and abandoned)"
            : "Include completed and abandoned plans (turn on for active only)"
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
