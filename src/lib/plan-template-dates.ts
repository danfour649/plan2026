import type { PlanTemplateResolved, PlanTemplateResolvedTask } from "@/data/planTemplates";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_GLOBAL = /\d{4}-\d{2}-\d{2}/g;

function localTodayIso(reference: Date = new Date()): string {
  const y = reference.getFullYear();
  const m = String(reference.getMonth() + 1).padStart(2, "0");
  const d = String(reference.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoToLocalDate(iso: string): Date {
  const [y, mo, day] = iso.split("-").map(Number);
  return new Date(y, mo - 1, day);
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole calendar days from `fromIso` to `toIso` (can be negative). */
function calendarDaysBetween(fromIso: string, toIso: string): number {
  const a = parseIsoToLocalDate(fromIso);
  const b = parseIsoToLocalDate(toIso);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function addCalendarDays(iso: string, deltaDays: number): string {
  const d = parseIsoToLocalDate(iso);
  d.setDate(d.getDate() + deltaDays);
  return formatLocalDate(d);
}

function collectIsoDatesFromTemplate(t: PlanTemplateResolved): Set<string> {
  const found = new Set<string>();
  const add = (s: string | undefined) => {
    if (s && ISO_DATE.test(s)) found.add(s);
  };
  const scanText = (text: string | undefined) => {
    if (!text) return;
    const matches = text.match(ISO_DATE_GLOBAL);
    if (matches) for (const m of matches) found.add(m);
  };
  add(t.startAt);
  add(t.endAt);
  scanText(t.description);
  scanText(t.goal);
  for (const task of t.tasks) {
    add(task.dueAt);
    scanText(task.content);
  }
  return found;
}

function minIsoDate(dates: Iterable<string>): string | undefined {
  let best: string | undefined;
  for (const d of dates) {
    if (!ISO_DATE.test(d)) continue;
    if (best === undefined || d < best) best = d;
  }
  return best;
}

function shiftTaskContent(content: string | undefined, shiftByDay: Map<string, string>): string | undefined {
  if (!content) return content;
  return content.replace(ISO_DATE_GLOBAL, (match) => shiftByDay.get(match) ?? match);
}

/**
 * Shifts every YYYY-MM-DD in the template (plan dates, task due dates, and dates embedded in task content)
 * so the earliest such date aligns with `referenceIso` (default: today in local time). Relative gaps are preserved.
 */
export function recalibratePlanTemplateDates(
  template: PlanTemplateResolved,
  referenceIso: string = localTodayIso(),
): PlanTemplateResolved {
  const dateSet = collectIsoDatesFromTemplate(template);
  const anchor = minIsoDate(dateSet);
  if (!anchor) {
    return template;
  }

  const delta = calendarDaysBetween(anchor, referenceIso);
  if (delta === 0) {
    return template;
  }

  const shiftByDay = new Map<string, string>();
  for (const d of dateSet) {
    shiftByDay.set(d, addCalendarDays(d, delta));
  }

  const shiftField = (iso: string | undefined) =>
    iso && ISO_DATE.test(iso) ? (shiftByDay.get(iso) ?? addCalendarDays(iso, delta)) : iso;

  const tasks: PlanTemplateResolvedTask[] = template.tasks.map((task) => ({
    ...task,
    dueAt: shiftField(task.dueAt),
    content: shiftTaskContent(task.content, shiftByDay),
  }));

  return {
    ...template,
    description: shiftTaskContent(template.description, shiftByDay),
    goal: shiftTaskContent(template.goal, shiftByDay),
    startAt: shiftField(template.startAt),
    endAt: shiftField(template.endAt),
    tasks,
  };
}

export { localTodayIso };
