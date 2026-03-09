/**
 * Static plan templates for "Start from template" on new plan page.
 * Names and task titles are i18n keys (templates.*); resolve with getTranslations(locale).
 */
export type PlanTemplateTask = {
  titleKey: string;
  urgency?: number;
};

export type PlanTemplateDefinition = {
  id: string;
  nameKey: string;
  goalKey?: string;
  tasks: PlanTemplateTask[];
};

export const PLAN_TEMPLATE_DEFINITIONS: PlanTemplateDefinition[] = [
  {
    id: "empty",
    nameKey: "empty",
    tasks: [],
  },
  {
    id: "project-launch",
    nameKey: "projectLaunch",
    goalKey: "projectLaunchGoal",
    tasks: [
      { titleKey: "projectLaunchTask1", urgency: 5 },
      { titleKey: "projectLaunchTask2", urgency: 5 },
      { titleKey: "projectLaunchTask3", urgency: 6 },
    ],
  },
  {
    id: "trip-planning",
    nameKey: "tripPlanning",
    goalKey: "tripPlanningGoal",
    tasks: [
      { titleKey: "tripPlanningTask1", urgency: 6 },
      { titleKey: "tripPlanningTask2", urgency: 5 },
      { titleKey: "tripPlanningTask3", urgency: 5 },
      { titleKey: "tripPlanningTask4", urgency: 4 },
    ],
  },
];

export type PlanTemplateResolved = {
  id: string;
  name: string;
  goal?: string;
  tasks: { title: string; urgency?: number }[];
};

type MessagesLike = { templates: Record<string, string> };

export function resolvePlanTemplates(
  definitions: PlanTemplateDefinition[],
  t: MessagesLike,
): PlanTemplateResolved[] {
  return definitions.map((def) => ({
    id: def.id,
    name: t.templates[def.nameKey] ?? def.id,
    goal: def.goalKey ? (t.templates[def.goalKey] ?? undefined) : undefined,
    tasks: def.tasks.map((task) => ({
      title: t.templates[task.titleKey] ?? task.titleKey,
      urgency: task.urgency,
    })),
  }));
}
