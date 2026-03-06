"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { TaskContentEditor } from "@/components/TaskContentEditor";
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
    <form action={formAction} className="mt-4 flex w-full flex-col gap-3 lg:mt-0 lg:max-w-2xl">
      <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-start">
        <input
          name="title"
          placeholder="Add a task…"
          required
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4 xl:w-80"
        />
        <div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center">
          <label className="text-xs whitespace-nowrap text-blue-700">Due (optional)</label>
          <input
            name="dueAt"
            type="datetime-local"
            className="w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4 sm:w-auto"
          />
        </div>
      </div>
      <div className="w-full">
        <label className="mb-2 block text-sm font-medium text-blue-950">Description</label>
        <TaskContentEditor name="content" />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 sm:w-auto"
      >
        Add
      </button>
    </form>
  );
}
