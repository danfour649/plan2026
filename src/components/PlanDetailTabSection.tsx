"use client";

import { type ReactNode, useEffect, useState } from "react";

type Tab = "tasks" | "list";

export type PlanDetailTabSectionProps = {
  planId: string;
  initialTab: Tab;
  taskPage: number;
  taskLimit: number;
  defaultTaskLimit: number;
  navAriaLabel: string;
  tasksTabLabel: string;
  suppliesTabLabel: string;
  isOwner: boolean;
  addTaskSlot: ReactNode;
  tasksHeader: ReactNode;
  suppliesHeader: ReactNode;
  tasksPanel: ReactNode;
  listPanel: ReactNode;
};

function tasksPath(planId: string, taskPage: number, taskLimit: number, defaultTaskLimit: number): string {
  const q = new URLSearchParams();
  if (taskPage > 1) q.set("taskPage", String(taskPage));
  if (taskLimit !== defaultTaskLimit) q.set("taskLimit", String(taskLimit));
  const s = q.toString();
  return s ? `/plans/${planId}?${s}` : `/plans/${planId}`;
}

const tabBtnActive =
  "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200";
const tabBtnInactive =
  "text-zinc-600 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-blue-200";

/**
 * Tasks vs supplies on plan detail: client-side tab state so switching does not trigger a full
 * RSC navigation (which was hiding the shell and refetching layout + plan data).
 */
export function PlanDetailTabSection({
  planId,
  initialTab,
  taskPage,
  taskLimit,
  defaultTaskLimit,
  navAriaLabel,
  tasksTabLabel,
  suppliesTabLabel,
  isOwner,
  addTaskSlot,
  tasksHeader,
  suppliesHeader,
  tasksPanel,
  listPanel,
}: PlanDetailTabSectionProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setTab(params.get("tab") === "list" ? "list" : "tasks");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goTasks = () => {
    setTab("tasks");
    window.history.replaceState(window.history.state ?? null, "", tasksPath(planId, taskPage, taskLimit, defaultTaskLimit));
  };

  const goList = () => {
    setTab("list");
    window.history.replaceState(window.history.state ?? null, "", `/plans/${planId}?tab=list`);
  };

  return (
    <section className="min-w-0 overflow-x-hidden rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
      <div className="sticky top-0 z-10 border-b border-blue-100 bg-white/90 px-3 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 max-sm:sticky sm:static sm:bg-transparent sm:backdrop-blur-none sm:dark:bg-transparent sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex gap-1" aria-label={navAriaLabel}>
              <button
                type="button"
                onClick={goTasks}
                aria-current={tab === "tasks" ? "page" : undefined}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${tab === "tasks" ? tabBtnActive : tabBtnInactive}`}
              >
                {tasksTabLabel}
              </button>
              <button
                type="button"
                onClick={goList}
                aria-current={tab === "list" ? "page" : undefined}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${tab === "list" ? tabBtnActive : tabBtnInactive}`}
              >
                {suppliesTabLabel}
              </button>
            </nav>
          </div>
          {tab === "tasks" && isOwner ? addTaskSlot : null}
        </div>
        {tab === "tasks" ? tasksHeader : suppliesHeader}
      </div>
      <div className={tab !== "tasks" ? "hidden" : undefined}>{tasksPanel}</div>
      <div className={tab !== "list" ? "hidden" : undefined}>{listPanel}</div>
    </section>
  );
}
