"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { TaskContentEditor } from "@/components/TaskContentEditor";
import type { ActionResult } from "@/lib/actions/tasks";

type AddTaskAction = (formData: FormData) => Promise<ActionResult>;

function wrap(
  fn: AddTaskAction
): (prev: ActionResult | null, formData: FormData) => Promise<ActionResult> {
  return (_prev, formData) => fn(formData);
}

function getDefaultDueAtValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  const hours = String(tomorrow.getHours()).padStart(2, "0");
  const minutes = String(tomorrow.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AddTaskForm({
  action,
  onSuccess,
}: {
  action: AddTaskAction;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(wrap(action), null as ActionResult | null);
  const defaultDueAtValue = useMemo(() => getDefaultDueAtValue(), []);
  const dueAtInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Task added");
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [onSuccess, state]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-2">
        <input
          name="title"
          placeholder="Task name"
          required
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs whitespace-nowrap text-blue-700">Due (optional)</label>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={dueAtInputRef}
              name="dueAt"
              type="datetime-local"
              defaultValue={defaultDueAtValue}
              className="w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
            />
            <button
              type="button"
              onClick={() => {
                if (dueAtInputRef.current) dueAtInputRef.current.value = "";
              }}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 sm:self-stretch"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-blue-950">Description</label>
        <TaskContentEditor name="content" />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 sm:w-auto"
      >
        Add task
      </button>
    </form>
  );
}
