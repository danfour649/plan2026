import { z } from "zod";

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

export const PLAN_STATUS_VALUES = ["draft", "started", "completed", "abandoned"] as const;
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
  newTaskTitles: z.preprocess(
    (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]),
    z.array(z.string().min(1, "New task title is required").max(PLAN_NAME_MAX_LENGTH)).default([]),
  ),
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
    status: z.enum(PLAN_STATUS_VALUES, { errorMap: () => ({ message: "Status must be draft, started, completed, or abandoned" }) }),
  })
  .refine(
    (data) => data.endAt >= data.startAt,
    { message: "End date must be on or after start date", path: ["endAt"] },
  );

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
