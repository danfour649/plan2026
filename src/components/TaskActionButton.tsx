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
  variant?: "default" | "muted";
};

export function TaskActionButton({
  action,
  taskId,
  label,
  variant = "default",
}: TaskActionButtonProps) {
  const [state, formAction] = useActionState(wrapForActionState(action), null as ActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(label === "Delete" ? "Task deleted" : label === "Mark done" ? "Marked done" : "Task restored");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, label]);

  return (
    <form action={formAction}>
      <input type="hidden" name="taskId" value={taskId} />
      <button
        type="submit"
        className={
          variant === "muted"
            ? "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            : "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
        }
      >
        {label}
      </button>
    </form>
  );
}
