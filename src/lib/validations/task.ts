import { z } from "zod";

/** Max length for task title (DB-safe, prevents huge payloads). */
export const TASK_TITLE_MAX_LENGTH = 500;

export const addTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(TASK_TITLE_MAX_LENGTH, `Title must be at most ${TASK_TITLE_MAX_LENGTH} characters`)
    .transform((s) => s.trim()),
});

export const taskIdSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});

export type AddTaskInput = z.infer<typeof addTaskSchema>;
export type TaskIdInput = z.infer<typeof taskIdSchema>;
