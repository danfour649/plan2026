import geminiAiPlanGeneric from "./gemini-ai-plan-generic.json";
import empty from "./empty.json";
import homeMove from "./home-move.json";
import jobSearch from "./job-search.json";
import productDiscovery from "./product-discovery.json";
import projectLaunch from "./project-launch.json";
import tripPlanning from "./trip-planning.json";
import { assertPlanTemplateRegistryIds } from "./types";
import { parsePlanTemplate, type PlanTemplateDefinition } from "./validate";

export type {
  PlanTemplateDefinition,
  PlanTemplateId,
  PlanTemplateIsoDate,
  PlanTemplateTask,
} from "./types";
export { isPlanTemplateId, PLAN_TEMPLATE_IDS } from "./types";
export { parsePlanTemplate, planTemplateJsonSchema, planTemplateTaskJsonSchema } from "./validate";

const _PLAN_TEMPLATE_DEFINITIONS: PlanTemplateDefinition[] = [
  parsePlanTemplate(empty),
  parsePlanTemplate(projectLaunch),
  parsePlanTemplate(tripPlanning),
  parsePlanTemplate(geminiAiPlanGeneric),
  parsePlanTemplate(jobSearch),
  parsePlanTemplate(productDiscovery),
  parsePlanTemplate(homeMove),
];

assertPlanTemplateRegistryIds(_PLAN_TEMPLATE_DEFINITIONS);

/**
 * Order = order shown in "Start from template". Add new templates here after adding a JSON file.
 */
export const PLAN_TEMPLATE_DEFINITIONS: readonly PlanTemplateDefinition[] = _PLAN_TEMPLATE_DEFINITIONS;
