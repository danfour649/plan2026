"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { FormSubmitButton } from "@/components/FormSubmitButton";
import { useTranslations } from "@/components/TranslationsProvider";

type DeletePlanAction = (formData: FormData) => Promise<void>;

type DeletePlanButtonProps = {
  planId: string;
  planName: string;
  action: DeletePlanAction;
};

export function DeletePlanButton({ planId, planName, action }: DeletePlanButtonProps) {
  const t = useTranslations();
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!showConfirm) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowConfirm(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showConfirm]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-400/90 bg-red-200/80 px-3 py-2 text-sm font-medium text-red-950 transition hover:bg-red-300/90 sm:justify-start sm:px-4 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100 dark:hover:bg-red-900"
        aria-label={t.plans.deletePlan}
      >
        <span className="sm:hidden" aria-hidden>
          <Trash2 className="size-5" />
        </span>
        <span className="hidden sm:inline">{t.plans.deletePlan}</span>
      </button>

      {showConfirm ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-zinc-950/45 px-4 pt-6 pb-8 sm:pt-8"
          onClick={() => setShowConfirm(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md shrink-0 rounded-2xl border border-border bg-white px-6 py-5 shadow-2xl shadow-blue-950/10 dark:bg-zinc-900 dark:shadow-zinc-950/50"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-plan-confirm-title"
          >
            <h2
              id="delete-plan-confirm-title"
              className="text-lg font-semibold tracking-tight text-blue-950 dark:text-zinc-100"
            >
              {t.plans.deletePlanConfirmTitle}
            </h2>
            <p className="mt-2 text-sm text-tertiary">
              {t.plans.deletePlanConfirmMessage.replace("{planName}", planName)}
            </p>
            <p className="mt-2 text-sm text-tertiary">{t.plans.deletePlanConfirmTasksExplainer}</p>
            <form action={action} className="mt-5">
              <input type="hidden" name="planId" value={planId} />
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-zinc-50/80 px-3 py-2.5 text-sm text-blue-950 dark:bg-zinc-800/60 dark:text-zinc-200">
                <input
                  type="checkbox"
                  name="deleteTasks"
                  value="1"
                  className="mt-0.5 size-4 shrink-0 rounded border-zinc-300 text-red-600 focus:ring-red-500 dark:border-zinc-600"
                />
                <span>{t.plans.deletePlanAlsoDeleteTasksLabel}</span>
              </label>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {t.common.cancel}
                </button>
                <FormSubmitButton
                  className="rounded-xl border border-red-800 bg-red-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900 dark:bg-red-800 dark:hover:bg-red-950"
                >
                  {t.plans.deletePlan}
                </FormSubmitButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
