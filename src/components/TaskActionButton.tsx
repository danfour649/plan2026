"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions/tasks";

type TaskAction = (formData: FormData) => Promise<ActionResult>;

function wrapForActionState(fn: TaskAction): (prev: ActionResult | null, formData: FormData) => Promise<ActionResult> {
  return (_prev, formData) => fn(formData);
}

type TaskActionButtonProps = {
  action: TaskAction;
  taskId: string;
  label: string;
  /** Translated message for success toast. If not provided, uses label. */
  successMessage?: string;
  variant?: "default" | "muted";
  /** When provided (e.g. on plan detail page), submitted with form so the plan page can revalidate. */
  planId?: string;
};

export function TaskActionButton({
  action,
  taskId,
  label,
  successMessage,
  variant = "default",
  planId,
}: TaskActionButtonProps) {
  const [state, formAction] = useActionState(wrapForActionState(action), null as ActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(successMessage ?? label);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, label, successMessage]);

  return (
    <form action={formAction}>
      <input type="hidden" name="taskId" value={taskId} />
      {planId ? <input type="hidden" name="planId" value={planId} /> : null}
      <button
        type="submit"
        className={
          variant === "muted"
            ? "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100"
            : "rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
        }
      >
        {label}
      </button>
    </form>
  );
}
