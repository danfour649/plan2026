"use client";

import { Save, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PlanForm } from "@/components/PlanForm";
import { clearEditPlanFormDirty, setEditPlanFormDirty } from "@/lib/editPlanDirty";
import type { PlanActionResult } from "@/lib/actions/plans";
import type { PlanFormInitialValues } from "@/components/PlanForm";

const EDIT_PLAN_FORM_ID = "edit-plan-form";

type EditPlanFormWrapperProps = {
  action: (formData: FormData) => Promise<PlanActionResult>;
  initialValues: PlanFormInitialValues;
  submitLabel: string;
  cancelLabel: string;
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
  submitLabel,
  cancelLabel,
  singleColumn,
  backLabel,
  confirmMessage,
  discardLeaveLabel,
  discardStayLabel,
  children,
}: EditPlanFormWrapperProps) {
  const router = useRouter();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [editFormDirty, setEditFormDirty] = useState(false);

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
    setEditFormDirty(false);
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
            if (editFormDirty) {
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
          linkableTasksScope="incomplete"
          isEdit={true}
          submitLabel={submitLabel}
          singleColumn={singleColumn}
          discardConfirmMessage={confirmMessage}
          onRequestDiscardConfirm={setShowDiscardConfirm}
          onDirtyChange={() => {
            setEditPlanFormDirty();
            setEditFormDirty(true);
          }}
          editFormDirty={editFormDirty}
          renderEditFooterOutside={true}
          editFormId={EDIT_PLAN_FORM_ID}
        />
        <div className="mt-4 flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 sm:flex-initial sm:flex-row sm:justify-start">
          {editFormDirty ? (
            <button
              type="button"
              aria-label={cancelLabel}
              onClick={() => setShowDiscardConfirm(true)}
              className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 sm:min-w-0 sm:px-4 sm:py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
            >
              <span className="sm:hidden" aria-hidden><X className="size-5" /></span>
              <span className="hidden sm:inline">{cancelLabel}</span>
            </button>
          ) : (
            <Link
              href="/plans"
              aria-label={cancelLabel}
              className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 sm:min-w-0 sm:px-4 sm:py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
            >
              <span className="sm:hidden" aria-hidden><X className="size-5" /></span>
              <span className="hidden sm:inline">{cancelLabel}</span>
            </Link>
          )}
          <button
            type="submit"
            form={EDIT_PLAN_FORM_ID}
            className="flex min-h-[2.75rem] min-w-0 items-center justify-center gap-2 rounded-xl bg-blue-600 p-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 dark:bg-blue-500 dark:shadow-zinc-950/40 dark:hover:bg-blue-600"
          >
            <span className="sm:hidden" aria-hidden><Save className="size-5" /></span>
            <span className="hidden sm:inline">{submitLabel}</span>
          </button>
        </div>
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
