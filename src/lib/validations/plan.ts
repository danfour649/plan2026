import { z } from "zod";

import { sanitizeTaskContent } from "@/lib/sanitize";
import {
  TASK_CONTENT_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  TASK_URGENCY_MAX,
  TASK_URGENCY_MIN,
} from "@/lib/validations/task";

export const PLAN_NAME_MAX_LENGTH = 500;
export const PLAN_DESCRIPTION_MAX_LENGTH = 10_000;
export const PLAN_GOAL_MAX_LENGTH = 500;
export const PLAN_NOTES_MAX_LENGTH = 10_000;
export const PLAN_COLOR_MAX_LENGTH = 50;
export const PLAN_IMAGE_URL_MAX_LENGTH = 2048;
export const PLAN_PRIORITY_MIN = 1;
export const PLAN_PRIORITY_MAX = 7;
export const PLAN_PERCENT_MIN = 0;
export const PLAN_PERCENT_MAX = 100;

export const PLAN_STATUS_VALUES = ["draft", "started", "on_hold", "completed", "abandoned"] as const;
export type PlanStatus = (typeof PLAN_STATUS_VALUES)[number];

const optionalDate = z
  .string()
  .optional()
  .transform((s) => {
    if (s == null || (typeof s === "string" && s.trim() === "")) return undefined;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

const optionalUrl = z
  .string()
  .optional()
  .transform((s) => {
    if (s == null || (typeof s === "string" && s.trim() === "")) return undefined;
    return s.trim();
  })
  .refine(
    (v) => v === undefined || (v.startsWith("https://") && v.length <= PLAN_IMAGE_URL_MAX_LENGTH),
    "Image URL must be https and at most 2048 characters",
  );

/**
 * Turn plain text (e.g. from plan templates) or HTML from the form into sanitized task HTML.
 */
export function taskContentFromPlainOrHtml(raw: string | undefined): string | undefined {
  if (raw == null || typeof raw !== "string" || raw.trim() === "") return undefined;
  let html: string;
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    html = raw.trim();
  } else {
    const escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = escaped
      .split(/\n\n+/)
      .filter((block) => block.length > 0)
      .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
      .join("");
  }
  const sanitized = sanitizeTaskContent(html);
  if (!sanitized.trim()) return undefined;
  return sanitized.length > TASK_CONTENT_MAX_LENGTH
    ? sanitized.slice(0, TASK_CONTENT_MAX_LENGTH)
    : sanitized;
}

export type NewPlanTaskPayload = {
  title: string;
  content?: string;
  dueAt?: Date;
  urgency: number;
};

function asFormText(v: FormDataEntryValue | undefined): string {
  return typeof v === "string" ? v : "";
}

/** Reads parallel newTask* fields from the plan form; skips rows with empty titles. */
export function buildNewPlanTasksFromFormData(formData: FormData): NewPlanTaskPayload[] {
  const titles = formData.getAll("newTaskTitle");
  const contents = formData.getAll("newTaskContent");
  const dueAts = formData.getAll("newTaskDueAt");
  const urgencies = formData.getAll("newTaskUrgency");
  const len = Math.max(titles.length, contents.length, dueAts.length, urgencies.length);
  const out: NewPlanTaskPayload[] = [];
  for (let i = 0; i < len; i++) {
    const title = asFormText(titles[i]).trim();
    if (!title) continue;
    const contentRaw = asFormText(contents[i]).trim();
    const rawDue = asFormText(dueAts[i]).trim();
    const u = urgencies[i];
    let urgency = 4;
    if (typeof u === "string" && u.trim() !== "") {
      const n = Number(u);
      if (Number.isFinite(n)) urgency = n;
    } else if (typeof u === "number" && Number.isFinite(u)) {
      urgency = u;
    }
    urgency = Math.min(TASK_URGENCY_MAX, Math.max(TASK_URGENCY_MIN, Math.round(urgency)));
    let dueAt: Date | undefined;
    if (rawDue) {
      const d = new Date(rawDue);
      if (!Number.isNaN(d.getTime())) dueAt = d;
    }
    out.push({
      title,
      content: taskContentFromPlainOrHtml(contentRaw || undefined),
      dueAt,
      urgency,
    });
  }
  return out;
}

const newPlanTaskSchema = z.object({
  title: z
    .string()
    .min(1, "New task title is required")
    .max(TASK_TITLE_MAX_LENGTH, `Task title must be at most ${TASK_TITLE_MAX_LENGTH} characters`)
    .transform((s) => s.trim()),
  content: z
    .string()
    .optional()
    .refine((v) => v === undefined || v.length <= TASK_CONTENT_MAX_LENGTH, "Task content too long"),
  dueAt: z.date().optional(),
  urgency: z
    .number()
    .int()
    .min(TASK_URGENCY_MIN, `Urgency must be between ${TASK_URGENCY_MIN} and ${TASK_URGENCY_MAX}`)
    .max(TASK_URGENCY_MAX, `Urgency must be between ${TASK_URGENCY_MIN} and ${TASK_URGENCY_MAX}`),
});

const basePlanSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(PLAN_NAME_MAX_LENGTH, `Name must be at most ${PLAN_NAME_MAX_LENGTH} characters`)
    .transform((s) => s.trim()),
  description: z
    .string()
    .optional()
    .transform((s) => (s != null && typeof s === "string" && s.trim() !== "" ? s.trim() : undefined))
    .refine((v) => v === undefined || v.length <= PLAN_DESCRIPTION_MAX_LENGTH, "Description too long"),
  goal: z
    .string()
    .optional()
    .transform((s) => (s != null && typeof s === "string" && s.trim() !== "" ? s.trim() : undefined))
    .refine((v) => v === undefined || v.length <= PLAN_GOAL_MAX_LENGTH, "Goal too long"),
  startAt: z.string().min(1).transform((s) => new Date(s)),
  endAt: z.string().min(1).transform((s) => new Date(s)),
  actualStartAt: optionalDate,
  actualEndAt: optionalDate,
  priority: z.coerce
    .number()
    .int()
    .min(PLAN_PRIORITY_MIN, `Priority must be between ${PLAN_PRIORITY_MIN} and ${PLAN_PRIORITY_MAX}`)
    .max(PLAN_PRIORITY_MAX, `Priority must be between ${PLAN_PRIORITY_MIN} and ${PLAN_PRIORITY_MAX}`),
  percentCompleted: z.coerce
    .number()
    .int()
    .min(PLAN_PERCENT_MIN, `Percent completed must be between ${PLAN_PERCENT_MIN} and ${PLAN_PERCENT_MAX}`)
    .max(PLAN_PERCENT_MAX, `Percent completed must be between ${PLAN_PERCENT_MIN} and ${PLAN_PERCENT_MAX}`),
  notes: z
    .string()
    .optional()
    .transform((s) => (s != null && typeof s === "string" && s.trim() !== "" ? s.trim() : undefined))
    .refine((v) => v === undefined || v.length <= PLAN_NOTES_MAX_LENGTH, "Notes too long"),
  color: z
    .string()
    .optional()
    .transform((s) => (s != null && typeof s === "string" && s.trim() !== "" ? s.trim() : undefined))
    .refine((v) => v === undefined || v.length <= PLAN_COLOR_MAX_LENGTH, "Color too long"),
  imageUrl: optionalUrl,
  taskIds: z.preprocess(
    (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]),
    z.array(z.string().min(1)).default([]),
  ),
  newTasks: z.array(newPlanTaskSchema).default([]),
});

export const createPlanSchema = basePlanSchema.refine(
  (data) => data.endAt >= data.startAt,
  { message: "End date must be on or after start date", path: ["endAt"] },
);

export const planIdSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
});

export const updatePlanSchema = basePlanSchema
  .merge(planIdSchema)
  .extend({
    status: z.enum(PLAN_STATUS_VALUES, {
      message: "Status must be draft, started, on hold, completed, or abandoned",
    }),
  })
  .refine(
    (data) => data.endAt >= data.startAt,
    { message: "End date must be on or after start date", path: ["endAt"] },
  );

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
