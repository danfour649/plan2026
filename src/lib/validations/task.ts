import { z } from "zod";

import { sanitizeTaskContent } from "@/lib/sanitize";

/** Max length for task title (DB-safe, prevents huge payloads). */
export const TASK_TITLE_MAX_LENGTH = 500;

/** Max length for task rich text content (HTML). */
export const TASK_CONTENT_MAX_LENGTH = 20_000;
export const TASK_URGENCY_MIN = 1;
export const TASK_URGENCY_MAX = 7;

export const addTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(TASK_TITLE_MAX_LENGTH, `Title must be at most ${TASK_TITLE_MAX_LENGTH} characters`)
    .transform((s) => s.trim()),
  content: z
    .string()
    .optional()
    .transform((s) => {
      if (s === undefined || s === null || (typeof s === "string" && s.trim() === ""))
        return undefined;
      return sanitizeTaskContent(String(s).trim());
    })
    .refine((v) => v === undefined || v.length <= TASK_CONTENT_MAX_LENGTH, "Content too long"),
  dueAt: z
    .string()
    .optional()
    .transform((s) => {
      if (s == null || s.trim() === "") return undefined;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }),
  urgency: z.coerce
    .number()
    .int()
    .min(TASK_URGENCY_MIN, `Urgency must be between ${TASK_URGENCY_MIN} and ${TASK_URGENCY_MAX}`)
    .max(TASK_URGENCY_MAX, `Urgency must be between ${TASK_URGENCY_MIN} and ${TASK_URGENCY_MAX}`),
  planId: z
    .string()
    .optional()
    .transform((s) => (s == null || (typeof s === "string" && s.trim() === "") ? undefined : s.trim()))
    .refine((v) => v === undefined || (v.length === 25 && /^c[a-z0-9]{24}$/.test(v)), "Invalid plan"),
});

/** CUID format used by Prisma @default(cuid()) - 25 chars, 'c' prefix, base36. */
const CUID_REGEX = /^c[a-z0-9]{24}$/;

export function isValidTaskId(value: string): boolean {
  return typeof value === "string" && value.length === 25 && CUID_REGEX.test(value);
}

export const taskIdSchema = z.object({
  taskId: z
    .string()
    .min(1, "Task ID is required")
    .refine((s) => CUID_REGEX.test(s), "Invalid task ID format"),
});

export const updateTaskSchema = addTaskSchema.merge(taskIdSchema);
