"use client";

import { Plus, Save, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/components/TranslationsProvider";

import { PlanForm } from "@/components/PlanForm";
import { EDIT_PLAN_FORM_ID } from "@/lib/edit-plan-form-id";
import { clearEditPlanFormDirty, setEditPlanFormDirty } from "@/lib/editPlanDirty";
import { registerPlanEditBackHandler } from "@/lib/planEditBackNav";
import type { PlanActionResult } from "@/lib/actions/plans";
import type { PlanFormInitialValues } from "@/components/PlanForm";

type EditPlanFormWrapperProps = {
  action: (formData: FormData) => Promise<PlanActionResult>;
  initialValues: PlanFormInitialValues;
  submitLabel: string;
  cancelLabel: string;
  singleColumn: boolean;
  confirmMessage: string;
  discardLeaveLabel: string;
  discardStayLabel: string;
  /** Optional header slot (e.g. plan title); may be rendered above the two-column layout on the plan page. */
  children?: React.ReactNode;
};

export function EditPlanFormWrapper({
  action,
  initialValues,
  submitLabel,
  cancelLabel,
  singleColumn,
  confirmMessage,
  discardLeaveLabel,
  discardStayLabel,
  children,
}: EditPlanFormWrapperProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [editFormDirty, setEditFormDirty] = useState(false);
  const addTaskRowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => clearEditPlanFormDirty();
  }, []);

  useEffect(() => {
    registerPlanEditBackHandler(() => {
      if (editFormDirty) {
        setShowDiscardConfirm(true);
        return;
      }
      router.push("/plans");
    });
    return () => registerPlanEditBackHandler(null);
  }, [editFormDirty, router]);

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
    <div className="min-w-0">
      <section className="min-w-0 overflow-x-hidden rounded-2xl border border-border bg-white/90 px-2 py-4 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40 sm:px-4 sm:py-6">
        {children ? <div className="mb-4 flex min-w-0 flex-col gap-3">{children}</div> : null}
        <PlanForm
          key={`${initialValues.planId}:${initialValues.taskIds.join("\0")}:${initialValues.logoAttachmentId ?? ""}`}
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
          onAddTaskRowRef={addTaskRowRef}
        />
        <div className="mt-4 flex min-w-0 items-center justify-between gap-2">
          {editFormDirty ? (
            <button
              type="button"
              aria-label={cancelLabel}
              onClick={() => setShowDiscardConfirm(true)}
              className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border p-2 text-sm font-medium transition max-sm:border-rose-400 max-sm:bg-rose-200 max-sm:text-rose-900 max-sm:hover:bg-rose-300 sm:border-blue-200 sm:bg-blue-50 sm:text-blue-700 sm:hover:bg-blue-100 sm:min-w-0 sm:px-4 sm:py-2 dark:max-sm:border-rose-800 dark:max-sm:bg-rose-900/40 dark:max-sm:text-rose-300 dark:max-sm:hover:bg-rose-800/50 dark:sm:border-zinc-600 dark:sm:bg-zinc-700 dark:sm:text-blue-200 dark:sm:hover:bg-zinc-600"
            >
              <span className="sm:hidden" aria-hidden><X className="size-5" /></span>
              <span className="hidden sm:inline">{cancelLabel}</span>
            </button>
          ) : (
            <Link
              href="/plans"
              aria-label={cancelLabel}
              className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border p-2 text-sm font-medium transition max-sm:border-rose-400 max-sm:bg-rose-200 max-sm:text-rose-900 max-sm:hover:bg-rose-300 sm:border-blue-200 sm:bg-blue-50 sm:text-blue-700 sm:hover:bg-blue-100 sm:min-w-0 sm:px-4 sm:py-2 dark:max-sm:border-rose-800 dark:max-sm:bg-rose-900/40 dark:max-sm:text-rose-300 dark:max-sm:hover:bg-rose-800/50 dark:sm:border-zinc-600 dark:sm:bg-zinc-700 dark:sm:text-blue-200 dark:sm:hover:bg-zinc-600"
            >
              <span className="sm:hidden" aria-hidden><X className="size-5" /></span>
              <span className="hidden sm:inline">{cancelLabel}</span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addTaskRowRef.current?.()}
              aria-label={t.planForm.addAnotherTask}
              className="flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-green-300 bg-green-200 p-2 text-sm text-green-800 transition hover:bg-green-300 sm:min-w-0 sm:px-3 sm:py-2 dark:border-green-700 dark:bg-green-800/50 dark:text-green-200 dark:hover:bg-green-700/60"
            >
              <span className="sm:hidden" aria-hidden><Plus className="size-5" /></span>
              <span className="hidden sm:inline">{t.planForm.addAnotherTask}</span>
            </button>
            <button
              type="submit"
              form={EDIT_PLAN_FORM_ID}
              className="flex min-h-[2.75rem] min-w-0 items-center justify-center gap-2 rounded-xl bg-blue-600 p-2 text-sm font-medium text-white shadow-sm shadow-shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <span className="sm:hidden" aria-hidden><Save className="size-5" /></span>
              <span className="hidden sm:inline">{submitLabel}</span>
            </button>
          </div>
        </div>
      </section>

      {showDiscardConfirm ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-zinc-950/45 px-4 py-6"
          onClick={() => setShowDiscardConfirm(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md shrink-0 rounded-2xl border border-border bg-white px-6 py-5 shadow-2xl shadow-blue-950/10 dark:bg-zinc-900 dark:shadow-zinc-950/50"
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
