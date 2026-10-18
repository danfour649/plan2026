import type { TaskRecurrence } from "@/generated/prisma/client";

import {
  formatWallDate,
  formatWallDateTime,
  isUtcMidnight,
  normalizeTimeZone,
  zonedWallTimeToUtc,
} from "@/lib/task-due";

/**
 * Next due instant for a recurring task. Preserves the wall-clock time in `timeZone`.
 * All-day dues advance the civil date and stay at UTC midnight.
 * Legacy rows (no zone) advance the UTC clock digits, which are the time the user entered.
 * If `dueAt` is null, advances from `now`.
 */
export function advanceTaskDueDate(
  dueAt: Date | null,
  recurrence: TaskRecurrence,
  now: Date = new Date(),
  options?: { timeZone?: string | null; allDay?: boolean },
): Date {
  const timeZone = normalizeTimeZone(options?.timeZone);
  const base =
    dueAt != null && !Number.isNaN(dueAt.getTime()) ? dueAt : new Date(now.getTime());
  const allDay =
    options?.allDay === true || (timeZone == null && dueAt != null && isUtcMidnight(dueAt));

  if (allDay) {
    const date = formatWallDate(base, "UTC");
    const [year, month, day] = shiftCivilDate(date, recurrence).split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  if (timeZone) {
    const wall = formatWallDateTime(base, timeZone);
    const [date, time] = wall.split("T");
    const [hour, minute] = time.split(":").map(Number);
    const [year, month, day] = shiftCivilDate(date, recurrence).split("-").map(Number);
    return zonedWallTimeToUtc(
      { year, month, day, hour, minute, second: 0, millisecond: 0 },
      timeZone,
    );
  }

  const date = formatWallDate(base, "UTC");
  const [year, month, day] = shiftCivilDate(date, recurrence).split("-").map(Number);
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      base.getUTCHours(),
      base.getUTCMinutes(),
      base.getUTCSeconds(),
      base.getUTCMilliseconds(),
    ),
  );
}

function shiftCivilDate(isoDate: string, recurrence: TaskRecurrence): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (recurrence === "daily") dt.setUTCDate(dt.getUTCDate() + 1);
  else if (recurrence === "weekly") dt.setUTCDate(dt.getUTCDate() + 7);
  else dt.setUTCMonth(dt.getUTCMonth() + 1);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
