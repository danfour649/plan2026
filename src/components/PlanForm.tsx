"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import type { PlanActionResult } from "@/lib/actions/plans";
import { PLAN_STATUS_VALUES } from "@/lib/validations/plan";

type PlanFormAction = (formData: FormData) => Promise<PlanActionResult>;

const PRIORITY_OPTIONS = [
  { value: 7, label: "7 - Highest", className: "bg-red-100 text-red-700" },
  { value: 6, label: "6", className: "bg-orange-100 text-orange-700" },
  { value: 5, label: "5", className: "bg-amber-100 text-amber-700" },
  { value: 4, label: "4", className: "bg-emerald-100 text-emerald-700" },
  { value: 3, label: "3", className: "bg-cyan-100 text-cyan-700" },
  { value: 2, label: "2", className: "bg-sky-100 text-sky-700" },
  { value: 1, label: "1 - Lowest", className: "bg-blue-100 text-blue-700" },
];

const COLOR_OPTIONS = [
  { value: "", label: "None" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "amber", label: "Amber" },
  { value: "red", label: "Red" },
  { value: "violet", label: "Violet" },
];

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function wrap(fn: PlanFormAction): (prev: PlanActionResult | null, formData: FormData) => Promise<PlanActionResult> {
  return (_prev, formData) => fn(formData);
}

export type PlanFormInitialValues = {
  planId: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  actualStartAt?: Date | string | null;
  actualEndAt?: Date | string | null;
  status: string;
  priority: number;
  percentCompleted: number;
  notes?: string | null;
  color?: string | null;
  imageUrl?: string | null;
  taskIds: string[];
};

type PlanFormProps = {
  action: PlanFormAction;
  initialValues?: PlanFormInitialValues | null;
  userTasks: { id: string; title: string }[];
  isEdit?: boolean;
  submitLabel: string;
};

export function PlanForm({ action, initialValues, userTasks, isEdit = false, submitLabel }: PlanFormProps) {
  const [state, formAction] = useActionState(wrap(action), null as PlanActionResult | null);
  const [newTaskTitles, setNewTaskTitles] = useState<string[]>([""]);

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const addNewTaskRow = () => setNewTaskTitles((prev) => [...prev, ""]);
  const removeNewTaskRow = (index: number) =>
    setNewTaskTitles((prev) => prev.filter((_, i) => i !== index));

  const defaultPriority = initialValues?.priority ?? 4;
  const defaultStatus = initialValues?.status ?? "draft";
  const defaultStart =
    initialValues?.startAt != null
      ? toDateInputValue(initialValues.startAt)
      : toDateInputValue(new Date());
  const defaultEnd =
    initialValues?.endAt != null
      ? toDateInputValue(initialValues.endAt)
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          return toDateInputValue(d);
        })();

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      {isEdit && initialValues?.planId ? (
        <input type="hidden" name="planId" value={initialValues.planId} />
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Name *</label>
        <input
          name="name"
          placeholder="Plan name"
          required
          defaultValue={initialValues?.name ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Description (optional)</label>
        <textarea
          name="description"
          placeholder="Describe the plan"
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Goal (optional)</label>
        <input
          name="goal"
          placeholder="e.g. Ship MVP"
          defaultValue={initialValues?.goal ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">Start date *</label>
          <input
            name="startAt"
            type="date"
            required
            defaultValue={defaultStart}
            className="w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">End date *</label>
          <input
            name="endAt"
            type="date"
            required
            defaultValue={defaultEnd}
            className="w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">Actual start (optional)</label>
          <input
            name="actualStartAt"
            type="date"
            defaultValue={toDateInputValue(initialValues?.actualStartAt)}
            className="w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">Actual end (optional)</label>
          <input
            name="actualEndAt"
            type="date"
            defaultValue={toDateInputValue(initialValues?.actualEndAt)}
            className="w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
      </div>

      {isEdit && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">Status</label>
          <select
            name="status"
            defaultValue={defaultStatus}
            className="w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          >
            {PLAN_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Priority (1–7)</label>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((option) => (
            <label key={option.value} className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="priority"
                value={option.value}
                defaultChecked={defaultPriority === option.value}
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

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Percent completed (0–100)</label>
        <input
          name="percentCompleted"
          type="number"
          min={0}
          max={100}
          defaultValue={initialValues?.percentCompleted ?? 0}
          className="w-full max-w-[8rem] rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Notes (optional)</label>
        <textarea
          name="notes"
          placeholder="Internal notes"
          rows={2}
          defaultValue={initialValues?.notes ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Color (optional)</label>
        <select
          name="color"
          defaultValue={initialValues?.color ?? ""}
          className="w-full max-w-xs rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
        >
          {COLOR_OPTIONS.map((c) => (
            <option key={c.value || "none"} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">Image URL (optional)</label>
        <input
          name="imageUrl"
          type="url"
          placeholder="https://..."
          defaultValue={initialValues?.imageUrl ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
        {initialValues?.imageUrl ? (
          <div className="mt-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- user-pasted URL, arbitrary host */}
            <img
              src={initialValues.imageUrl}
              alt=""
              className="max-h-32 rounded-lg border border-blue-100 object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-blue-950">Tasks in this plan</label>
        <p className="text-xs text-zinc-500">Select existing tasks or add new ones below.</p>
        {userTasks.length > 0 ? (
          <ul className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/30 p-3">
            {userTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="taskIds"
                  value={task.id}
                  defaultChecked={initialValues?.taskIds?.includes(task.id)}
                  className="h-4 w-4 rounded border-blue-200"
                />
                <span className="text-sm text-blue-950">{task.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No tasks yet. Add new tasks below or create some from the Tasks page.</p>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-blue-950">Add new tasks</span>
          {newTaskTitles.map((title, index) => (
            <div key={index} className="flex gap-2">
              <input
                name="newTaskTitle"
                defaultValue={title}
                placeholder="New task title"
                className="flex-1 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
              />
              <button
                type="button"
                onClick={() => removeNewTaskRow(index)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addNewTaskRow}
            className="self-start rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
          >
            Add another task
          </button>
        </div>
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
