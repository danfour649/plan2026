"use client";

import { Check, RotateCcw } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { FormSubmitButton } from "@/components/FormSubmitButton";
import type { ActionResult } from "@/lib/actions/tasks";

/** useActionState passes (prevState, formData); server actions accept both. */
type TaskAction = (prevState: ActionResult | null, formData: FormData) => Promise<ActionResult>;

type TaskActionButtonProps = {
  action: TaskAction;
  taskId: string;
  label: string;
  /** Translated message for success toast. If not provided, uses label. */
  successMessage?: string;
  variant?: "default" | "muted";
  /** When provided (e.g. on plan detail page), submitted with form so the plan page can revalidate. */
  planId?: string;
  /**
   * Below `sm`, render a square icon button; from `sm`, render the full text label.
   * Use `actionVisual` to pick the icon (complete vs restore).
   */
  compact?: boolean;
  actionVisual?: "complete" | "restore";
};

export function TaskActionButton({
  action,
  taskId,
  label,
  successMessage,
  variant = "default",
  planId,
  compact = false,
  actionVisual = "complete",
}: TaskActionButtonProps) {
  const [state, formAction] = useActionState(action, null as ActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(successMessage ?? label);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, label, successMessage]);

  const baseTone =
    variant === "muted"
      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100";

  const sizeClass = compact
    ? "inline-flex max-sm:h-10 max-sm:w-10 max-sm:items-center max-sm:justify-center max-sm:p-0 max-sm:shrink-0 sm:px-3 sm:py-2"
    : "px-3 py-2";

  return (
    <form action={formAction} className={compact ? "inline-flex shrink-0" : undefined}>
      <input type="hidden" name="taskId" value={taskId} />
      {planId ? <input type="hidden" name="planId" value={planId} /> : null}
      <FormSubmitButton
        className={`rounded-xl border text-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${baseTone} ${sizeClass}`}
      >
        {compact ? (
          <>
            <span className="sr-only sm:hidden">{label}</span>
            {actionVisual === "restore" ? (
              <RotateCcw className="h-5 w-5 sm:hidden" strokeWidth={2} aria-hidden />
            ) : (
              <Check className="h-5 w-5 sm:hidden" strokeWidth={2} aria-hidden />
            )}
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          label
        )}
      </FormSubmitButton>
    </form>
  );
}
