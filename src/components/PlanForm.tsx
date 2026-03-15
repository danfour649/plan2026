"use client";

import { Minus, Plus, Save, X } from "lucide-react";

import { FormSubmitButton } from "@/components/FormSubmitButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PlanFlag } from "@/components/PlanFlag";
import { useTranslations } from "@/components/TranslationsProvider";
import type { PlanActionResult } from "@/lib/actions/plans";
import { clearEditPlanFormDirty, getEditPlanFormDirty } from "@/lib/editPlanDirty";
import { clearNewPlanFormDirty, getNewPlanFormDirty } from "@/lib/newPlanDirty";
import { PLAN_STATUS_VALUES } from "@/lib/validations/plan";

type PlanFormAction = (formData: FormData) => Promise<PlanActionResult>;

const PRIORITY_OPTIONS = [
  { value: 7, label: "7 - Highest", shortLabel: "7", className: "bg-red-100 text-red-700" },
  { value: 6, label: "6", className: "bg-orange-100 text-orange-700" },
  { value: 5, label: "5", className: "bg-amber-100 text-amber-700" },
  { value: 4, label: "4", className: "bg-emerald-100 text-emerald-700" },
  { value: 3, label: "3", className: "bg-cyan-100 text-cyan-700" },
  { value: 2, label: "2", className: "bg-sky-100 text-sky-700" },
  { value: 1, label: "1 - Lowest", shortLabel: "1", className: "bg-blue-100 text-blue-700" },
];

const COLOR_OPTIONS = [
  { value: "", labelKey: "none" as const },
  { value: "blue", labelKey: "blue" as const },
  { value: "green", labelKey: "green" as const },
  { value: "amber", labelKey: "amber" as const },
  { value: "red", labelKey: "red" as const },
  { value: "violet", labelKey: "violet" as const },
  { value: "black", labelKey: "black" as const },
  { value: "pink", labelKey: "pink" as const },
  { value: "silver", labelKey: "silver" as const },
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

type ColorOption = (typeof COLOR_OPTIONS)[number];

function PlanColorDropdown({
  initialColor,
  options,
  label,
  getOptionLabel,
  onDirty,
}: {
  initialColor: string;
  options: ColorOption[];
  label: string;
  getOptionLabel: (labelKey: string) => string;
  onDirty: () => void;
}) {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-blue-950 dark:text-blue-100">{label}</label>
      <input type="hidden" name="color" value={selectedColor} />
      <div className="relative max-w-xs" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          className="flex min-w-0 w-full items-center gap-2 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-left text-sm text-zinc-900 outline-none ring-blue-200/70 transition placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800/95 dark:text-zinc-100 dark:ring-zinc-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
        >
          {selectedColor ? (
            <>
              <PlanFlag color={selectedColor} size={14} className="shrink-0" />
              <span className="truncate">{getOptionLabel(options.find((o) => o.value === selectedColor)?.labelKey ?? selectedColor)}</span>
            </>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">{getOptionLabel("none")}</span>
          )}
          <span className="ml-auto shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden>{open ? "▲" : "▼"}</span>
        </button>
        {open ? (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 max-h-56 w-full min-w-[8rem] overflow-auto rounded-xl border border-blue-100 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
          >
            {options.map((c) => (
              <li
                key={c.value || "none"}
                role="option"
                aria-selected={selectedColor === c.value}
                onClick={() => {
                  setSelectedColor(c.value);
                  onDirty();
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedColor(c.value);
                    onDirty();
                    setOpen(false);
                  }
                }}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-zinc-900 hover:bg-blue-50 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                {c.value ? (
                  <>
                    <PlanFlag color={c.value} size={14} className="shrink-0" />
                    <span>{getOptionLabel(c.labelKey)}</span>
                  </>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">{getOptionLabel(c.labelKey)}</span>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
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
  /** Optional id for the form element. */
  formId?: string;
  /** When set (e.g. on new plan page), Cancel shows confirm if form is dirty. */
  discardConfirmMessage?: string;
  /** When user clicks Cancel and form is dirty, open custom confirm dialog (parent shows it). */
  onRequestDiscardConfirm?: (open: boolean) => void;
  /** Callback when user edits any field (e.g. sets module-level dirty flag). */
  onDirtyChange?: () => void;
  /** When creating a new plan, optional pre-fill from template (name, goal, new task titles). */
  templateInitialValues?: { name: string; goal?: string; newTaskTitles: string[] };
};

export function PlanForm({
  action,
  initialValues,
  userTasks,
  isEdit = false,
  submitLabel,
  singleColumn = false,
  formId,
  discardConfirmMessage,
  onRequestDiscardConfirm,
  onDirtyChange,
  templateInitialValues,
}: PlanFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const markDirty = () => onDirtyChange?.();
  const [state, formAction] = useActionState(wrap(action), null as PlanActionResult | null);
  const [newTaskTitles, setNewTaskTitles] = useState<string[]>(
    templateInitialValues?.newTaskTitles?.length
      ? templateInitialValues.newTaskTitles
      : [""],
  );
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
    <form
      id={formId}
      action={formAction}
      className="flex min-w-0 max-w-full flex-col gap-4 overflow-x-hidden sm:gap-6"
    >
      {isEdit && initialValues?.planId ? (
        <input type="hidden" name="planId" value={initialValues.planId} />
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.priorityLabel}</label>
        <div className="flex flex-wrap gap-2 pl-2">
          {PRIORITY_OPTIONS.map((option) => (
            <label key={option.value} className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="priority"
                value={option.value}
                defaultChecked={defaultPriority === option.value}
                onChange={markDirty}
                className="peer sr-only"
              />
              <span
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition hover:opacity-90 peer-checked:ring-2 peer-checked:ring-blue-400 peer-checked:ring-offset-2 ${option.className}`}
              >
                {"shortLabel" in option && option.shortLabel ? (
                  <>
                    <span className="sm:hidden">{option.shortLabel}</span>
                    <span className="hidden sm:inline">{option.label}</span>
                  </>
                ) : (
                  option.label
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.percentCompletedLabel}</label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            name="percentCompleted"
            type="range"
            min={0}
            max={100}
            value={percentCompleted}
            onChange={(e) => {
              setPercentCompleted(Number(e.target.value));
              markDirty();
            }}
            className="h-2.5 w-full min-w-0 flex-1 rounded-full bg-blue-100 accent-blue-600 dark:bg-zinc-700 dark:accent-blue-500 sm:max-w-[12rem]"
            aria-valuenow={percentCompleted}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <span className="shrink-0 w-10 text-right text-sm font-medium text-blue-950 dark:text-zinc-100" aria-hidden="true">
            {percentCompleted}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.common.nameRequired}</label>
        <input
          name="name"
          placeholder={t.plans.planNamePlaceholder}
          required
          defaultValue={initialValues?.name ?? templateInitialValues?.name ?? ""}
          onInput={markDirty}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition text-zinc-900 placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.common.descriptionOptional}</label>
        <textarea
          name="description"
          placeholder={t.plans.describePlanPlaceholder}
          rows={3}
          defaultValue={initialValues?.description ?? ""}
          onInput={markDirty}
          className="min-h-[4.5rem] w-full min-w-0 resize-y rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition text-zinc-900 placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.goalOptional}</label>
        <input
          name="goal"
          placeholder={t.planForm.goalPlaceholder}
          defaultValue={initialValues?.goal ?? templateInitialValues?.goal ?? ""}
          onInput={markDirty}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition text-zinc-900 placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
        />
      </div>

      <div className={singleColumn ? "flex flex-col gap-4" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.startDateRequired}</label>
          <input
            name="startAt"
            type="date"
            required
            defaultValue={defaultStart}
            onChange={markDirty}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-200/70 transition placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.endDateRequired}</label>
          <input
            name="endAt"
            type="date"
            required
            defaultValue={defaultEnd}
            onChange={markDirty}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-200/70 transition placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
          />
        </div>
      </div>

      <div className={singleColumn ? "flex flex-col gap-4" : "grid min-w-0 gap-4 sm:grid-cols-2"}>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.actualStartOptional}</label>
          <input
            name="actualStartAt"
            type="date"
            defaultValue={toDateInputValue(initialValues?.actualStartAt)}
            onChange={markDirty}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-200/70 transition placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.actualEndOptional}</label>
          <input
            name="actualEndAt"
            type="date"
            defaultValue={toDateInputValue(initialValues?.actualEndAt)}
            onChange={markDirty}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-200/70 transition placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
          />
        </div>
      </div>

      {isEdit && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.status}</label>
          <select
            name="status"
            defaultValue={defaultStatus}
            onChange={markDirty}
            className="min-w-0 w-full rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-200/70 transition placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
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
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.notesOptional}</label>
        <textarea
          name="notes"
          placeholder={t.plans.internalNotesPlaceholder}
          rows={2}
          defaultValue={initialValues?.notes ?? ""}
          onInput={markDirty}
          className="min-h-[3.5rem] w-full min-w-0 resize-y rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition text-zinc-900 placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
        />
      </div>

      <PlanColorDropdown
        key={`color-${initialValues?.planId ?? "new"}-${initialValues?.color ?? ""}`}
        initialColor={initialValues?.color ?? ""}
        options={COLOR_OPTIONS}
        label={t.planForm.flagOptional}
        getOptionLabel={(labelKey) => t.form[labelKey as keyof typeof t.form]}
        onDirty={markDirty}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.imageUrlOptional}</label>
        <input
          name="imageUrl"
          type="url"
          placeholder={t.planForm.imageUrlPlaceholder}
          defaultValue={initialValues?.imageUrl ?? ""}
          onInput={markDirty}
          className="w-full min-w-0 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition text-zinc-900 placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
        />
        {initialValues?.imageUrl ? (
          <div className="mt-1 flex justify-start">
            <div
              className="h-40 w-40 max-w-full rounded-lg border border-blue-100 bg-zinc-50 bg-contain bg-center bg-no-repeat dark:border-zinc-600 dark:bg-zinc-800"
              style={{ backgroundImage: `url(${initialValues.imageUrl})` }}
              role="img"
              aria-label=""
            />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <label className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.tasksInPlanLabel}</label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.planForm.selectTasksDescription}</p>
        {userTasks.length > 0 ? (
          <details className="group rounded-xl border border-blue-100 bg-blue-50/30 dark:border-zinc-600 dark:bg-zinc-800/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-blue-950 transition hover:bg-blue-100/50 dark:text-zinc-100 dark:hover:bg-zinc-700/50 [&::-webkit-details-marker]:hidden">
              <span>
                {t.planForm.selectTasksSummary}
                <span className="ml-1.5 text-zinc-500 font-normal dark:text-zinc-400">
                  ({t.planForm.selectedCount.replace("{{count}}", String(initialValues?.taskIds?.length ?? 0))})
                </span>
              </span>
              <span className="shrink-0 text-zinc-400 transition group-open:rotate-180 dark:text-zinc-500" aria-hidden>
                ▼
              </span>
            </summary>
            <div className="border-t border-blue-100 px-3 pb-3 pt-2 dark:border-zinc-600">
              <input
                type="search"
                value={taskSearchFilter}
                onChange={(e) => setTaskSearchFilter(e.target.value)}
                placeholder={t.plans.searchTasksPlaceholder}
                aria-label={t.plans.filterTasksByName}
                className="mb-2 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-200/70 transition placeholder:text-zinc-500 focus:border-blue-300 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
              />
              <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-lg border border-blue-100 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-800">
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
                        onChange={markDirty}
                        className="h-4 w-4 shrink-0 rounded border-blue-200 dark:border-zinc-500"
                        id={`plan-form-task-${task.id}`}
                      />
                      <label htmlFor={`plan-form-task-${task.id}`} className="min-w-0 flex-1 cursor-pointer truncate text-sm text-blue-950 dark:text-zinc-100">
                        {task.title}
                      </label>
                    </li>
                  );
                })}
                {taskSearchFilter.trim() !== "" &&
                  !userTasks.some((t) =>
                    t.title.toLowerCase().includes(taskSearchFilter.toLowerCase()),
                  ) ? (
                  <li className="py-2 px-1.5 text-sm text-zinc-500 dark:text-zinc-400">{t.planForm.noTasksMatchSearch}</li>
                ) : null}
              </ul>
            </div>
          </details>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.planForm.noTasksYetDescription}</p>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.planForm.addNewTasksLabel}</span>
          {newTaskTitles.map((title, index) => (
            <div key={index} className="flex min-w-0 flex-row gap-2">
              <input
                name="newTaskTitle"
                defaultValue={title}
                placeholder={t.plans.newTaskTitlePlaceholder}
                onInput={markDirty}
                className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-white/95 px-3 py-2 text-sm outline-none ring-blue-200/70 transition text-zinc-900 placeholder:text-zinc-500 focus:border-blue-300 focus:ring-4 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-500 dark:focus:ring-blue-500/30"
              />
              <button
                type="button"
                onClick={() => removeNewTaskRow(index)}
                aria-label={t.common.remove}
                className="flex shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm text-blue-700 transition hover:bg-blue-100 sm:px-3 sm:py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
              >
                <span className="sm:hidden" aria-hidden><Minus className="size-5" /></span>
                <span className="hidden sm:inline">{t.common.remove}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-row flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-start sm:justify-start">
        <button
          type="button"
          onClick={addNewTaskRow}
          aria-label={t.planForm.addAnotherTask}
          className="flex shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm text-blue-700 transition hover:bg-blue-100 sm:px-3 sm:py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
        >
          <span className="sm:hidden" aria-hidden><Plus className="size-5" /></span>
          <span className="hidden sm:inline">{t.planForm.addAnotherTask}</span>
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
        <FormSubmitButton
          aria-label={submitLabel}
          className="flex min-h-[2.75rem] min-w-0 items-center justify-center gap-2 rounded-xl bg-blue-600 p-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 dark:bg-blue-500 dark:shadow-zinc-950/40 dark:hover:bg-blue-600"
        >
          <span className="sm:hidden" aria-hidden><Save className="size-5" /></span>
          <span className="hidden sm:inline">{submitLabel}</span>
        </FormSubmitButton>
        {!isEdit && discardConfirmMessage ? (
          <button
            type="button"
            onClick={() => {
              if (getNewPlanFormDirty()) {
                onRequestDiscardConfirm?.(true);
                return;
              }
              clearNewPlanFormDirty();
              router.push("/plans");
            }}
            aria-label={t.common.cancel}
            className="flex min-h-[2.75rem] min-w-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 sm:px-4 sm:py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
          >
            <span className="sm:hidden" aria-hidden><X className="size-5" /></span>
            <span className="hidden sm:inline">{t.common.cancel}</span>
          </button>
        ) : isEdit && onRequestDiscardConfirm && discardConfirmMessage ? (
          <button
            type="button"
            onClick={() => {
              if (getEditPlanFormDirty()) {
                onRequestDiscardConfirm(true);
                return;
              }
              clearEditPlanFormDirty();
              router.push(initialValues?.planId ? `/plans/${initialValues.planId}` : "/plans");
            }}
            aria-label={t.common.cancel}
            className="flex min-h-[2.75rem] min-w-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 sm:px-4 sm:py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
          >
            <span className="sm:hidden" aria-hidden><X className="size-5" /></span>
            <span className="hidden sm:inline">{t.common.cancel}</span>
          </button>
        ) : (
          <Link
            href={isEdit && initialValues?.planId ? `/plans/${initialValues.planId}` : "/plans"}
            aria-label={t.common.cancel}
            className="flex min-h-[2.75rem] min-w-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 sm:px-4 sm:py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
          >
            <span className="sm:hidden" aria-hidden><X className="size-5" /></span>
            <span className="hidden sm:inline">{t.common.cancel}</span>
          </Link>
        )}
        </div>
      </div>
    </form>
  );
}
