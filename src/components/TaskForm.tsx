"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { TaskContentEditor } from "@/components/TaskContentEditor";
import type { ActionResult } from "@/lib/actions/tasks";

type TaskFormAction = (formData: FormData) => Promise<ActionResult>;

type TaskFormProps = {
  action: TaskFormAction;
  onSuccess?: () => void;
  submitLabel: string;
  successMessage: string;
  initialValues?: {
    taskId?: string;
    title?: string;
    content?: string;
    dueAt?: string | null;
    urgency?: number;
  };
};

const URGENCY_OPTIONS = [
  { value: 7, label: "7 - Highest", className: "bg-red-100 text-red-700" },
  { value: 6, label: "6", className: "bg-orange-100 text-orange-700" },
  { value: 5, label: "5", className: "bg-amber-100 text-amber-700" },
  { value: 4, label: "4", className: "bg-emerald-100 text-emerald-700" },
  { value: 3, label: "3", className: "bg-cyan-100 text-cyan-700" },
  { value: 2, label: "2", className: "bg-sky-100 text-sky-700" },
  { value: 1, label: "1 - Lowest", className: "bg-blue-100 text-blue-700" },
];

function wrap(
  fn: TaskFormAction,
): (prev: ActionResult | null, formData: FormData) => Promise<ActionResult> {
  return (_prev, formData) => fn(formData);
}

function formatDateTimeLocal(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultDueAtValue(initialDueAt?: string | null) {
  if (initialDueAt) {
    const parsed = new Date(initialDueAt);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateTimeLocal(parsed);
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return formatDateTimeLocal(tomorrow);
}

export function TaskForm({
  action,
  onSuccess,
  submitLabel,
  successMessage,
  initialValues,
}: TaskFormProps) {
  const [state, formAction] = useActionState(wrap(action), null as ActionResult | null);
  const defaultDueAtValue = useMemo(
    () => getDefaultDueAtValue(initialValues?.dueAt),
    [initialValues?.dueAt],
  );
  const defaultUrgency = initialValues?.urgency ?? 4;
  const dueAtInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success(successMessage);
      onSuccess?.();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [onSuccess, state, successMessage]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      {initialValues?.taskId ? <input type="hidden" name="taskId" value={initialValues.taskId} /> : null}
      <div className="flex w-full flex-col gap-2">
        <input
          name="title"
          placeholder="Task name"
          required
          defaultValue={initialValues?.title ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs whitespace-nowrap text-blue-700">Urgency</label>
          <div className="flex flex-wrap gap-2">
            {URGENCY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="inline-flex cursor-pointer items-center gap-2"
              >
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  defaultChecked={defaultUrgency === option.value}
                  className="peer sr-only"
                />
                <span
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition hover:opacity-90 peer-checked:ring-2 peer-checked:ring-blue-400 peer-checked:ring-offset-2 ${option.className}`}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
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
        <TaskContentEditor
          name="content"
          defaultValue={initialValues?.content ?? ""}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 sm:w-auto"
      >
        {submitLabel}
      </button>
    </form>
  );
}
