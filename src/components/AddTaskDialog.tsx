"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { AddTaskForm } from "@/components/AddTaskForm";
import { useTranslations } from "@/components/TranslationsProvider";
import type { ActionResult } from "@/lib/actions/tasks";

type AddTaskAction = (formData: FormData) => Promise<ActionResult>;

export function AddTaskDialog({
  action,
  plans,
  defaultPlanId,
}: {
  action: AddTaskAction;
  plans?: { id: string; name: string }[];
  /** When opening from a plan page, pre-select this plan so the new task is added to it. */
  defaultPlanId?: string;
}) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 sm:h-auto sm:w-fit sm:px-4 sm:py-2"
        aria-label={t.common.addTask}
      >
        <span className="text-xl font-medium sm:hidden" aria-hidden>+</span>
        <span className="hidden text-sm font-medium sm:inline">{t.common.addTask}</span>
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-950/45 px-4 py-4 sm:py-8"
            onClick={() => setIsOpen(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col rounded-3xl border border-blue-100 bg-white px-6 pb-6 pt-4 shadow-2xl shadow-blue-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-950/50 sm:my-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-task-dialog-title"
            >
              <div className="mb-1 flex items-start justify-between gap-4">
                <div>
                  <h2 id="add-task-dialog-title" className="text-xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100">
                    {t.common.addTask}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                  aria-label={t.common.closeAddTaskDialog}
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M5 5L15 15M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <AddTaskForm action={action} onSuccess={() => setIsOpen(false)} plans={plans} defaultPlanId={defaultPlanId} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
