"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PlanForm } from "@/components/PlanForm";
import { clearEditPlanFormDirty, getEditPlanFormDirty, setEditPlanFormDirty } from "@/lib/editPlanDirty";
import type { PlanActionResult } from "@/lib/actions/plans";
import type { PlanFormInitialValues } from "@/components/PlanForm";

type EditPlanFormWrapperProps = {
  action: (formData: FormData) => Promise<PlanActionResult>;
  initialValues: PlanFormInitialValues;
  userTasks: { id: string; title: string }[];
  submitLabel: string;
  singleColumn: boolean;
  backLabel: string;
  confirmMessage: string;
  discardLeaveLabel: string;
  discardStayLabel: string;
  children: React.ReactNode;
};

export function EditPlanFormWrapper({
  action,
  initialValues,
  userTasks,
  submitLabel,
  singleColumn,
  backLabel,
  confirmMessage,
  discardLeaveLabel,
  discardStayLabel,
  children,
}: EditPlanFormWrapperProps) {
  const router = useRouter();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    return () => clearEditPlanFormDirty();
  }, []);

  useEffect(() => {
    if (!showDiscardConfirm) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowDiscardConfirm(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDiscardConfirm]);

  const handleLeave = () => {
    clearEditPlanFormDirty();
    setShowDiscardConfirm(false);
    router.push("/plans");
  };

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex min-w-0 flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            if (getEditPlanFormDirty()) {
              setShowDiscardConfirm(true);
              return;
            }
            router.push("/plans");
          }}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10l5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel}
        </button>
        {children}
      </div>

      <section className="min-w-0 overflow-x-hidden rounded-2xl border border-blue-100 bg-white/90 px-2 py-4 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40 sm:px-4 sm:py-6">
        <PlanForm
          action={action}
          initialValues={initialValues}
          userTasks={userTasks}
          isEdit={true}
          submitLabel={submitLabel}
          singleColumn={singleColumn}
          discardConfirmMessage={confirmMessage}
          onRequestDiscardConfirm={setShowDiscardConfirm}
          onDirtyChange={setEditPlanFormDirty}
        />
      </section>

      {showDiscardConfirm ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-zinc-950/45 px-4 py-6"
          onClick={() => setShowDiscardConfirm(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md shrink-0 rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-2xl shadow-blue-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-950/50"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-edit-confirm-title"
          >
            <h2 id="discard-edit-confirm-title" className="text-lg font-semibold tracking-tight text-blue-950 dark:text-zinc-100">
              {confirmMessage}
            </h2>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {discardStayLabel}
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="rounded-xl border border-amber-200 bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 dark:border-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                {discardLeaveLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
