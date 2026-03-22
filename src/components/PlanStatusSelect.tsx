"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { refreshNavCounts } from "@/components/NavCountsBadges";
import { useTranslations } from "@/components/TranslationsProvider";
import type { PlanActionResult } from "@/lib/actions/plans";
import { PLAN_STATUS_VALUES } from "@/lib/validations/plan";

type UpdatePlanStatusAction = (formData: FormData) => Promise<PlanActionResult>;

function wrap(
  fn: UpdatePlanStatusAction,
): (prev: PlanActionResult | null, formData: FormData) => Promise<PlanActionResult> {
  return (_prev, formData) => fn(formData);
}

type PlanStatusSelectProps = {
  planId: string;
  currentStatus: string;
  action: UpdatePlanStatusAction;
};

export function PlanStatusSelect({ planId, currentStatus, action }: PlanStatusSelectProps) {
  const t = useTranslations();
  const [state, formAction] = useActionState(wrap(action), null as PlanActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(t.toasts.statusUpdated);
      refreshNavCounts();
    } else {
      toast.error(state.error);
    }
  }, [state, t.toasts.statusUpdated]);

  return (
    <form action={formAction} className="inline-block">
      <input type="hidden" name="planId" value={planId} />
      <select
        name="status"
        defaultValue={currentStatus}
        onChange={(e) => {
          e.currentTarget.form?.requestSubmit();
        }}
        className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-sm text-blue-950 transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        aria-label={t.calendar.changePlanStatus}
      >
        {PLAN_STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {t.planStatus[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
