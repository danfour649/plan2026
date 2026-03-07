"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { PlanActionResult } from "@/lib/actions/plans";
import { formatPlanStatus, PLAN_STATUS_VALUES } from "@/lib/validations/plan";

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
  const [state, formAction] = useActionState(wrap(action), null as PlanActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Status updated");
    } else {
      toast.error(state.error);
    }
  }, [state]);

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
        aria-label="Change plan status"
      >
        {PLAN_STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {formatPlanStatus(s)}
          </option>
        ))}
      </select>
    </form>
  );
}
