import { z } from "zod";

import { sanitizeTaskContent } from "@/lib/sanitize";

/** Max length for task title (DB-safe, prevents huge payloads). */
export const TASK_TITLE_MAX_LENGTH = 500;

/** Max length for task rich text content (HTML). */
export const TASK_CONTENT_MAX_LENGTH = 20_000;

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
});

export const taskIdSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});
