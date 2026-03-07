"use client";

import { useEffect, useState } from "react";

type DeletePlanAction = (formData: FormData) => Promise<void>;

type DeletePlanButtonProps = {
  planId: string;
  planName: string;
  action: DeletePlanAction;
};

export function DeletePlanButton({ planId, planName, action }: DeletePlanButtonProps) {
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
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        <span className="sm:hidden">Delete</span>
        <span className="hidden sm:inline">Delete plan</span>
      </button>

      {showConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4 py-8"
          onClick={() => setShowConfirm(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-blue-100 bg-white px-6 py-5 shadow-2xl shadow-blue-950/10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-plan-confirm-title"
          >
            <h2
              id="delete-plan-confirm-title"
              className="text-lg font-semibold tracking-tight text-blue-950"
            >
              Delete plan?
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Are you sure you want to delete <strong>{planName}</strong>? Tasks in this plan will be
              kept but unlinked.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                Cancel
              </button>
              <form action={action} className="inline">
                <input type="hidden" name="planId" value={planId} />
                <button
                  type="submit"
                  className="rounded-xl border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Delete plan
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
