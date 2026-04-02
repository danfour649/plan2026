import type { PlanTemplateDefinition, PlanTemplateTask } from "./validate";

export type { PlanTemplateDefinition, PlanTemplateTask };

/** Calendar date string (YYYY-MM-DD) as used in template JSON; validated in `validate.ts` Zod schemas. */
export type PlanTemplateIsoDate = string;

/**
 * Registered template `id` values. Keep in sync when adding a `.json` file and an entry in `index.ts`.
 */
export const PLAN_TEMPLATE_IDS = [
  "empty",
  "project-launch",
  "trip-planning",
  "gemini-ai-plan-generic",
  "job-search",
  "product-discovery",
  "home-move",
] as const;

export type PlanTemplateId = (typeof PLAN_TEMPLATE_IDS)[number];

export function isPlanTemplateId(value: string): value is PlanTemplateId {
  return (PLAN_TEMPLATE_IDS as readonly string[]).includes(value);
}

/** Ensures every loaded template id is listed in {@link PLAN_TEMPLATE_IDS}. */
export function assertPlanTemplateRegistryIds(definitions: readonly PlanTemplateDefinition[]): void {
  for (const d of definitions) {
    if (!isPlanTemplateId(d.id)) {
      throw new Error(
        `Plan template id "${d.id}" is not in PLAN_TEMPLATE_IDS. Add it to src/data/plan-templates/types.ts when registering a new template.`,
      );
    }
  }
}
