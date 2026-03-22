/**
 * Plan templates for "Start from template" on the new plan page.
 * Each template lives in `plan-templates/*.json`; register imports in `plan-templates/index.ts`.
 * Templates may use i18n keys (nameKey, titleKey) or literal strings (name, title, content).
 */
import {
  isPlanTemplateId,
  PLAN_TEMPLATE_DEFINITIONS as _PLAN_TEMPLATE_DEFINITIONS,
  PLAN_TEMPLATE_IDS,
  type PlanTemplateDefinition,
  type PlanTemplateId,
  type PlanTemplateIsoDate,
  type PlanTemplateTask,
} from "./plan-templates";

export type {
  PlanTemplateDefinition,
  PlanTemplateId,
  PlanTemplateIsoDate,
  PlanTemplateTask,
};
export { isPlanTemplateId, PLAN_TEMPLATE_IDS };

export const PLAN_TEMPLATE_DEFINITIONS = _PLAN_TEMPLATE_DEFINITIONS;

export type PlanTemplateResolvedTask = {
  title: string;
  urgency?: number;
  content?: string;
  dueAt?: string;
};

export type PlanTemplateResolved = {
  id: string;
  name: string;
  goal?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  tasks: PlanTemplateResolvedTask[];
};

type MessagesLike = { templates: Record<string, string> };

export function resolvePlanTemplates(
  definitions: readonly PlanTemplateDefinition[],
  t: MessagesLike,
): PlanTemplateResolved[] {
  return definitions.map((def) => ({
    id: def.id,
    name: def.name ?? (def.nameKey ? (t.templates[def.nameKey] ?? def.nameKey) : def.id),
    goal: def.goal ?? (def.goalKey ? (t.templates[def.goalKey] ?? undefined) : undefined),
    description: def.description,
    startAt: def.startAt,
    endAt: def.endAt,
    tasks: def.tasks.map((task) => ({
      title: task.title ?? (task.titleKey ? (t.templates[task.titleKey] ?? task.titleKey) : ""),
      urgency: task.urgency,
      content: task.content,
      dueAt: task.dueAt,
    })),
  }));
}
