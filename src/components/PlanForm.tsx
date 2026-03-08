"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
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
  { value: "", labelKey: "none" as const },
  { value: "blue", labelKey: "blue" as const },
  { value: "green", labelKey: "green" as const },
  { value: "amber", labelKey: "amber" as const },
  { value: "red", labelKey: "red" as const },
  { value: "violet", labelKey: "violet" as const },
];

/** Flag emoji per plan color (for display as "flag" in UI; DB field remains "color"). */
const FLAG_EMOJI: Record<string, string> = {
  "": "",
  blue: "🔵",
  green: "🟢",
  amber: "🟡",
  red: "🔴",
  violet: "🟣",
};

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
  /** When true, use single column for date fields (one per line) instead of side-by-side grids. */
  singleColumn?: boolean;
};

export function PlanForm({
  action,
  initialValues,
  userTasks,
  isEdit = false,
  submitLabel,
  singleColumn = false,
}: PlanFormProps) {
  const t = useTranslations();
  const [state, formAction] = useActionState(wrap(action), null as PlanActionResult | null);
  const [newTaskTitles, setNewTaskTitles] = useState<string[]>([""]);
  const [taskSearchFilter, setTaskSearchFilter] = useState("");
  const [percentCompleted, setPercentCompleted] = useState(initialValues?.percentCompleted ?? 0);

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    const next = initialValues?.percentCompleted ?? 0;
    const id = setTimeout(() => setPercentCompleted(next), 0);
    return () => clearTimeout(id);
  }, [initialValues?.percentCompleted]);

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
    <form action={formAction} className="flex min-w-0 max-w-full flex-col gap-4 overflow-x-hidden sm:gap-6">
      {isEdit && initialValues?.planId ? (
        <input type="hidden" name="planId" value={initialValues.planId} />
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">{t.planForm.priorityLabel}</label>
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
        <label className="text-sm font-medium text-blue-950">{t.planForm.percentCompletedLabel}</label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            name="percentCompleted"
            type="range"
            min={0}
            max={100}
            value={percentCompleted}
            onChange={(e) => setPercentCompleted(Number(e.target.value))}
            className="h-2.5 w-full min-w-0 flex-1 rounded-full bg-blue-100 accent-blue-600 sm:max-w-[12rem]"
            aria-valuenow={percentCompleted}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <span className="shrink-0 w-10 text-right text-sm font-medium text-blue-950" aria-hidden="true">
            {percentCompleted}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">{t.common.nameRequired}</label>
        <input
          name="name"
          placeholder={t.plans.planNamePlaceholder}
          required
          defaultValue={initialValues?.name ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">{t.common.descriptionOptional}</label>
        <textarea
          name="description"
          placeholder={t.plans.describePlanPlaceholder}
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          className="min-h-[4.5rem] w-full min-w-0 resize-y rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">{t.planForm.goalOptional}</label>
        <input
          name="goal"
          placeholder={t.planForm.goalPlaceholder}
          defaultValue={initialValues?.goal ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className={singleColumn ? "flex flex-col gap-4" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">{t.planForm.startDateRequired}</label>
          <input
            name="startAt"
            type="date"
            required
            defaultValue={defaultStart}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">{t.planForm.endDateRequired}</label>
          <input
            name="endAt"
            type="date"
            required
            defaultValue={defaultEnd}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
      </div>

      <div className={singleColumn ? "flex flex-col gap-4" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">{t.planForm.actualStartOptional}</label>
          <input
            name="actualStartAt"
            type="date"
            defaultValue={toDateInputValue(initialValues?.actualStartAt)}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">{t.planForm.actualEndOptional}</label>
          <input
            name="actualEndAt"
            type="date"
            defaultValue={toDateInputValue(initialValues?.actualEndAt)}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          />
        </div>
      </div>

      {isEdit && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-blue-950">{t.planForm.status}</label>
          <select
            name="status"
            defaultValue={defaultStatus}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4"
          >
            {PLAN_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {t.planStatus[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">{t.planForm.notesOptional}</label>
        <textarea
          name="notes"
          placeholder={t.plans.internalNotesPlaceholder}
          rows={2}
          defaultValue={initialValues?.notes ?? ""}
          className="min-h-[3.5rem] w-full min-w-0 resize-y rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">{t.planForm.flagOptional}</label>
        <select
          name="color"
          defaultValue={initialValues?.color ?? ""}
          className="min-w-0 w-full max-w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition focus:border-blue-300 focus:ring-4 sm:max-w-xs"
        >
          {COLOR_OPTIONS.map((c) => (
            <option key={c.value || "none"} value={c.value}>
              {FLAG_EMOJI[c.value] ? `${FLAG_EMOJI[c.value]} ${t.form[c.labelKey]}` : t.form[c.labelKey]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950">{t.planForm.imageUrlOptional}</label>
        <input
          name="imageUrl"
          type="url"
          placeholder={t.planForm.imageUrlPlaceholder}
          defaultValue={initialValues?.imageUrl ?? ""}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
        />
        {initialValues?.imageUrl ? (
          <div className="mt-1 flex justify-start">
            <div
              className="h-40 w-40 max-w-full rounded-lg border border-blue-100 bg-zinc-50 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${initialValues.imageUrl})` }}
              role="img"
              aria-label=""
            />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <label className="text-sm font-medium text-blue-950">{t.planForm.tasksInPlanLabel}</label>
        <p className="text-xs text-zinc-500">{t.planForm.selectTasksDescription}</p>
        {userTasks.length > 0 ? (
          <details className="group rounded-xl border border-blue-100 bg-blue-50/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-blue-950 transition hover:bg-blue-100/50 [&::-webkit-details-marker]:hidden">
              <span>
                {t.planForm.selectTasksSummary}
                <span className="ml-1.5 text-zinc-500 font-normal">
                  ({t.planForm.selectedCount.replace("{{count}}", String(initialValues?.taskIds?.length ?? 0))})
                </span>
              </span>
              <span className="shrink-0 text-zinc-400 transition group-open:rotate-180" aria-hidden>
                ▼
              </span>
            </summary>
            <div className="border-t border-blue-100 px-3 pb-3 pt-2">
              <input
                type="search"
                value={taskSearchFilter}
                onChange={(e) => setTaskSearchFilter(e.target.value)}
                placeholder={t.plans.searchTasksPlaceholder}
                aria-label={t.plans.filterTasksByName}
                className="mb-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-2"
              />
              <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-lg border border-blue-100 bg-white p-2">
                {userTasks.map((task) => {
                  const matches =
                    taskSearchFilter.trim() === "" ||
                    task.title.toLowerCase().includes(taskSearchFilter.toLowerCase());
                  return (
                    <li
                      key={task.id}
                      className={`flex items-center gap-2 py-1 px-1.5 rounded-md ${matches ? "" : "hidden"}`}
                    >
                      <input
                        type="checkbox"
                        name="taskIds"
                        value={task.id}
                        defaultChecked={initialValues?.taskIds?.includes(task.id)}
                        className="h-4 w-4 shrink-0 rounded border-blue-200"
                        id={`plan-form-task-${task.id}`}
                      />
                      <label htmlFor={`plan-form-task-${task.id}`} className="min-w-0 flex-1 cursor-pointer truncate text-sm text-blue-950">
                        {task.title}
                      </label>
                    </li>
                  );
                })}
                {taskSearchFilter.trim() !== "" &&
                  !userTasks.some((t) =>
                    t.title.toLowerCase().includes(taskSearchFilter.toLowerCase()),
                  ) ? (
                  <li className="py-2 px-1.5 text-sm text-zinc-500">{t.planForm.noTasksMatchSearch}</li>
                ) : null}
              </ul>
            </div>
          </details>
        ) : (
          <p className="text-sm text-zinc-500">{t.planForm.noTasksYetDescription}</p>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-blue-950">{t.planForm.addNewTasksLabel}</span>
          {newTaskTitles.map((title, index) => (
            <div key={index} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-2">
              <input
                name="newTaskTitle"
                defaultValue={title}
                placeholder={t.plans.newTaskTitlePlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition placeholder:text-zinc-400 focus:border-blue-300 focus:ring-4"
              />
              <button
                type="button"
                onClick={() => removeNewTaskRow(index)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
              >
                {t.common.remove}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addNewTaskRow}
            className="self-start rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
          >
            {t.planForm.addAnotherTask}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="min-h-[2.75rem] w-full min-w-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 sm:w-auto"
      >
        {submitLabel}
      </button>
    </form>
  );
}
