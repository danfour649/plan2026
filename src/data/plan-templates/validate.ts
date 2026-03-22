import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const planTemplateTaskJsonSchema = z
  .object({
    titleKey: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    urgency: z.number().int().min(1).max(7).optional(),
    content: z.string().optional(),
    dueAt: isoDate.optional(),
  })
  .refine((t) => Boolean(t.titleKey?.trim()) || Boolean(t.title?.trim()), {
    message: "Each task must include titleKey or title",
  });

export const planTemplateJsonSchema = z
  .object({
    id: z.string().min(1),
    nameKey: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    goalKey: z.string().min(1).optional(),
    goal: z.string().optional(),
    description: z.string().optional(),
    startAt: isoDate.optional(),
    endAt: isoDate.optional(),
    tasks: z.array(planTemplateTaskJsonSchema),
  })
  .refine((d) => Boolean(d.nameKey?.trim()) || Boolean(d.name?.trim()), {
    message: "Template must include nameKey or name",
  });

export type PlanTemplateDefinition = z.infer<typeof planTemplateJsonSchema>;
export type PlanTemplateTask = z.infer<typeof planTemplateTaskJsonSchema>;

export function parsePlanTemplate(data: unknown): PlanTemplateDefinition {
  const parsed = planTemplateJsonSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((e) => e.message).join("; ");
    throw new Error(`Invalid plan template JSON: ${msg}`);
  }
  return parsed.data;
}
