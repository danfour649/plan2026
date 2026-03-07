"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import { sharePlanByEmail } from "@/lib/actions/plans";

export function SharePlanButton({ planId }: { planId: string }) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const result = await sharePlanByEmail(planId, email);
      if (result.success) {
        toast.success(t.toasts.planShared);
        setEmail("");
        setIsOpen(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
      >
        {t.toasts.share}
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-zinc-950/45 px-4 pt-6 pb-8 sm:pt-8"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm shrink-0 rounded-2xl border border-blue-100 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-plan-title"
          >
            <h2 id="share-plan-title" className="text-lg font-semibold text-blue-950">
              {t.sharePlan.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {t.sharePlan.description}
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.common.emailPlaceholder}
                className="rounded-xl border border-blue-200 px-3 py-2 text-sm"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? t.toasts.sharing : t.toasts.share}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
