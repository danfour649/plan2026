/**
 * Task due dates are civil times in a user's IANA time zone, not the server's zone.
 *
 * `datetime-local` submits a zone-less string (`2026-10-19T09:00`). `new Date(that)`
 * reads it in the host zone, which is UTC on Vercel, so 09:00 was stored as 09:00Z
 * and then shown again in the browser zone (America/Halifax → 06:00).
 *
 * New timed values are converted to a real UTC instant and the zone is stored on the
 * task. Legacy rows (no zone) keep the UTC clock digits, which are what the UTC
 * server saved from the input, so existing tasks still display as entered.
 * Date-only values are all-day civil dates and must not shift a day.
 */

import type { Locale } from "@/lib/i18n";
import { intlLocaleTagForAppLocale } from "@/lib/format";

export type TaskDueParts = {
  dueAt: Date;
  /** IANA zone the wall time belongs to. Null on legacy rows. */
  dueTimeZone: string | null;
  dueAllDay: boolean;
};

export type TaskDueFields = {
  dueAt: Date | null;
  dueTimeZone?: string | null;
  dueAllDay?: boolean | null;
};

export type CalendarDateTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/;

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Empty or unknown zones become null so callers fall back explicitly. */
export function normalizeTimeZone(timeZone: string | null | undefined): string | null {
  if (timeZone == null) return null;
  const trimmed = timeZone.trim();
  if (!trimmed || !isValidIanaTimeZone(trimmed)) return null;
  return trimmed;
}

export function readBrowserTimeZone(): string {
  try {
    return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) ?? "UTC";
  } catch {
    return "UTC";
  }
}

function isValidCivilDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

function milliseconds(fraction: string | undefined): number {
  if (!fraction) return 0;
  return Number(fraction.padEnd(3, "0").slice(0, 3));
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function wallToUtcGuess(wall: WallTime): number {
  return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second, wall.millisecond);
}

function partsInZone(date: Date, timeZone: string): WallTime {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
    millisecond: 0,
  };
}

/** Offset of `timeZone` at `utcMs`: wall clock = UTC + offset. */
function zoneOffsetMs(utcMs: number, timeZone: string): number {
  return wallToUtcGuess(partsInZone(new Date(utcMs), timeZone)) - utcMs;
}

/** Wall-clock time in `timeZone` → absolute instant. */
export function zonedWallTimeToUtc(wall: WallTime, timeZone: string): Date {
  const guess = wallToUtcGuess(wall);
  const offset = zoneOffsetMs(guess, timeZone);
  let utc = guess - offset;
  const corrected = zoneOffsetMs(utc, timeZone);
  if (corrected !== offset) utc = guess - corrected;
  return new Date(utc);
}

export function formatWallDate(date: Date, timeZone: string): string {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function formatWallDateTime(date: Date, timeZone: string): string {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function addCivilDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return formatWallDate(dt, "UTC");
}

/** `YYYY-MM-DDTHH:mm` plus minutes, carrying the civil date when needed. */
export function addMinutesToWall(wall: string, minutes: number): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(wall);
  if (!match) return wall;
  const total = Number(match[2]) * 60 + Number(match[3]) + minutes;
  const dayDelta = Math.floor(total / (24 * 60));
  const mins = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const date = dayDelta === 0 ? match[1] : addCivilDays(match[1], dayDelta);
  return `${date}T${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

function isAllDayFlag(value: boolean | string | null | undefined): boolean {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  const flag = value.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "on" || flag === "yes";
}

export function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/**
 * All-day when the row says so, or when a legacy row is exactly UTC midnight.
 * Legacy date-only template dues were stored as UTC midnight with no zone.
 * A timed midnight entered with a zone is not legacy and stays a timed event.
 */
export function isAllDayDue(due: TaskDueFields): boolean {
  if (!due.dueAt || Number.isNaN(due.dueAt.getTime())) return false;
  if (due.dueAllDay) return true;
  if (normalizeTimeZone(due.dueTimeZone)) return false;
  return isUtcMidnight(due.dueAt);
}

/** Zone used to render a timed due. All-day and legacy rows use UTC clock digits. */
export function dueClockTimeZone(due: TaskDueFields): string {
  if (!due.dueAt || isAllDayDue(due)) return "UTC";
  return normalizeTimeZone(due.dueTimeZone) ?? "UTC";
}

function civilUtcMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Parse a form or API due value.
 * - `YYYY-MM-DD` (or an all-day flag) → civil date, UTC midnight, all-day
 * - zone-less `YYYY-MM-DDTHH:mm` + IANA zone → that wall time
 * - zone-less without a zone → UTC wall clock (legacy / explicit), zone left null
 * - `Z` or a numeric offset → that absolute instant; zone recorded when provided
 */
export function parseTaskDueInput(
  raw: string | null | undefined,
  options?: { timeZone?: string | null; allDay?: boolean | string | null },
): TaskDueParts | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!value) return null;

  const timeZone = normalizeTimeZone(options?.timeZone);
  const forceAllDay = isAllDayFlag(options?.allDay);

  const dateOnly = DATE_ONLY.exec(value);
  if (dateOnly || forceAllDay) {
    const source = dateOnly ?? DATE_TIME.exec(value);
    if (!source) return null;
    const year = Number(source[1]);
    const month = Number(source[2]);
    const day = Number(source[3]);
    if (!isValidCivilDate(year, month, day)) return null;
    return {
      dueAt: civilUtcMidnight(year, month, day),
      dueTimeZone: timeZone,
      dueAllDay: true,
    };
  }

  const match = DATE_TIME.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const ms = milliseconds(match[7]);
  const offset = match[8];
  if (!isValidCivilDate(year, month, day) || hour > 23 || minute > 59 || second > 59) return null;

  if (offset) {
    const instant = new Date(value.replace(" ", "T"));
    if (Number.isNaN(instant.getTime())) return null;
    return {
      dueAt: instant,
      dueTimeZone: timeZone ?? "UTC",
      dueAllDay: false,
    };
  }

  const wall: WallTime = { year, month, day, hour, minute, second, millisecond: ms };
  if (timeZone) {
    return {
      dueAt: zonedWallTimeToUtc(wall, timeZone),
      dueTimeZone: timeZone,
      dueAllDay: false,
    };
  }
  return {
    dueAt: new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms)),
    dueTimeZone: null,
    dueAllDay: false,
  };
}

function formatInZone(
  date: Date,
  timeZone: string,
  appLocale: Locale,
  style: "dateTime" | "date" | "dateShort",
): string {
  const tag = intlLocaleTagForAppLocale(appLocale);
  if (style === "dateShort") {
    return date.toLocaleDateString(tag, { month: "short", day: "numeric", timeZone });
  }
  const datePart = date.toLocaleDateString(tag, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
  if (style === "date") return datePart;
  const timePart = date.toLocaleTimeString(tag, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  return `${datePart} ${timePart}`;
}

/** Desktop due label. All-day rows are a date with no clock time. */
export function formatTaskDuePrimary(due: TaskDueFields, appLocale: Locale): string {
  if (!due.dueAt || Number.isNaN(due.dueAt.getTime())) return "";
  if (isAllDayDue(due)) return formatInZone(due.dueAt, "UTC", appLocale, "date");
  return formatInZone(due.dueAt, dueClockTimeZone(due), appLocale, "dateTime");
}

/** Compact month-and-day label. Uses the due's clock zone so the day does not shift. */
export function formatTaskDueDateShort(due: TaskDueFields, appLocale: Locale): string {
  if (!due.dueAt || Number.isNaN(due.dueAt.getTime())) return "";
  return formatInZone(due.dueAt, dueClockTimeZone(due), appLocale, "dateShort");
}

/** Value for `datetime-local` or `date`, in the zone the user originally entered. */
export function taskDueInputValue(
  dueAtIso: string | null | undefined,
  options?: { dueTimeZone?: string | null; dueAllDay?: boolean | null },
): { value: string; allDay: boolean } {
  if (!dueAtIso) return { value: "", allDay: Boolean(options?.dueAllDay) };
  const dueAt = new Date(dueAtIso);
  if (Number.isNaN(dueAt.getTime())) return { value: "", allDay: false };
  const due: TaskDueFields = {
    dueAt,
    dueTimeZone: options?.dueTimeZone,
    dueAllDay: options?.dueAllDay,
  };
  if (isAllDayDue(due)) return { value: formatWallDate(dueAt, "UTC"), allDay: true };
  return { value: formatWallDateTime(dueAt, dueClockTimeZone(due)), allDay: false };
}

export function isTaskOverdue(due: TaskDueFields, now: Date, viewerTimeZone: string | null): boolean {
  if (!due.dueAt || Number.isNaN(due.dueAt.getTime())) return false;
  const viewer = normalizeTimeZone(viewerTimeZone) ?? "UTC";
  if (isAllDayDue(due)) {
    return formatWallDate(now, viewer) > formatWallDate(due.dueAt, "UTC");
  }
  if (normalizeTimeZone(due.dueTimeZone)) {
    return due.dueAt.getTime() < now.getTime();
  }
  const wall = partsInZone(due.dueAt, "UTC");
  return zonedWallTimeToUtc(wall, viewer).getTime() < now.getTime();
}

/**
 * Google Calendar times.
 * Timed events use a zone-less local dateTime plus `timeZone` so the event is
 * 09:00 in that zone, not 09:00Z rendered in the viewer's offset.
 * All-day events use exclusive `date` end, on the civil date, not the previous evening.
 * A missing due becomes an all-day event for "today" in the viewer's zone.
 */
export function buildCalendarEventWhen(input: {
  dueAt: Date | null;
  dueTimeZone?: string | null;
  dueAllDay?: boolean | null;
  viewerTimeZone?: string | null;
  now?: Date;
}): { start: CalendarDateTime; end: CalendarDateTime } {
  const now = input.now ?? new Date();
  const viewer = normalizeTimeZone(input.viewerTimeZone) ?? "UTC";
  const due: TaskDueFields = {
    dueAt: input.dueAt,
    dueTimeZone: input.dueTimeZone,
    dueAllDay: input.dueAllDay,
  };

  if (!input.dueAt || Number.isNaN(input.dueAt.getTime())) {
    const today = formatWallDate(now, viewer);
    return { start: { date: today }, end: { date: addCivilDays(today, 1) } };
  }

  if (isAllDayDue(due)) {
    const date = formatWallDate(input.dueAt, "UTC");
    return { start: { date }, end: { date: addCivilDays(date, 1) } };
  }

  const storedZone = normalizeTimeZone(input.dueTimeZone);
  const startWall = formatWallDateTime(input.dueAt, storedZone ?? "UTC");
  const endWall = addMinutesToWall(startWall, 60);
  const eventZone = storedZone ?? viewer;
  return {
    start: { dateTime: `${startWall}:00`, timeZone: eventZone },
    end: { dateTime: `${endWall}:00`, timeZone: eventZone },
  };
}
