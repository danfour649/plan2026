"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions/tasks";

type AddTaskAction = (formData: FormData) => Promise<ActionResult>;

function wrap(
  fn: AddTaskAction
): (prev: ActionResult | null, formData: FormData) => Promise<ActionResult> {
  return (_prev, formData) => fn(formData);
}

export function AddTaskForm({ action }: { action: AddTaskAction }) {
  const [state, formAction] = useActionState(wrap(action), null as ActionResult | null);

  useEffect(() => {
    if (!state) return;
    if (state.success) toast.success("Task added");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="mt-4 flex gap-2 sm:mt-0">
      <input
        name="title"
        placeholder="Add a task…"
        className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4 sm:w-80"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Add
      </button>
    </form>
  );
}
