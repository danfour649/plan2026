import { describe, expect, it } from "vitest";

import { advanceTaskDueDate } from "./task-recurrence";
import { addTaskSchema } from "./validations/task";
import {
  buildCalendarEventWhen,
  formatTaskDuePrimary,
  isTaskOverdue,
  parseTaskDueInput,
  taskDueInputValue,
} from "./task-due";

function spaces(value: string): string {
  return value.replace(/\s+/g, " ");
}

const HALIFAX = "America/Halifax";

describe("task due times in America/Halifax", () => {
  it("parses the task form the way a Halifax browser submits it", () => {
    const parsed = addTaskSchema.safeParse({
      title: "Call the dentist",
      dueAt: "2026-10-19T09:00",
      timeZone: HALIFAX,
      urgency: 4,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.dueAt?.toISOString()).toBe("2026-10-19T12:00:00.000Z");
    expect(parsed.data.dueTimeZone).toBe(HALIFAX);
    expect(parsed.data.dueAllDay).toBe(false);
  });

  it("stores 09:00 as 12:00Z and shows 9:00 AM back", () => {
    const parsed = parseTaskDueInput("2026-10-19T09:00", { timeZone: HALIFAX });
    expect(parsed).not.toBeNull();
    expect(parsed?.dueAllDay).toBe(false);
    expect(parsed?.dueTimeZone).toBe(HALIFAX);
    expect(parsed?.dueAt.toISOString()).toBe("2026-10-19T12:00:00.000Z");

    const label = spaces(
      formatTaskDuePrimary(
        { dueAt: parsed!.dueAt, dueTimeZone: parsed!.dueTimeZone, dueAllDay: false },
        "en",
      ),
    );
    expect(label).toContain("Oct 19, 2026");
    expect(label).toContain("9:00 AM");
    expect(label).not.toContain("6:00");

    expect(
      taskDueInputValue(parsed!.dueAt.toISOString(), {
        dueTimeZone: HALIFAX,
        dueAllDay: false,
      }),
    ).toEqual({ value: "2026-10-19T09:00", allDay: false });
  });

  it("creates a Google Calendar event at 9:00–10:00 with timeZone America/Halifax", () => {
    const parsed = parseTaskDueInput("2026-10-19T09:00", { timeZone: HALIFAX });
    expect(
      buildCalendarEventWhen({
        dueAt: parsed!.dueAt,
        dueTimeZone: HALIFAX,
        dueAllDay: false,
        viewerTimeZone: HALIFAX,
      }),
    ).toEqual({
      start: { dateTime: "2026-10-19T09:00:00", timeZone: HALIFAX },
      end: { dateTime: "2026-10-19T10:00:00", timeZone: HALIFAX },
    });
  });

  it("shows legacy UTC wall-clock rows as entered, including from a Halifax process", () => {
    const label = spaces(
      formatTaskDuePrimary(
        { dueAt: new Date("2026-10-19T09:00:00.000Z"), dueTimeZone: null, dueAllDay: false },
        "en",
      ),
    );
    expect(label).toContain("Oct 19, 2026");
    expect(label).toContain("9:00 AM");
    expect(label).not.toContain("6:00");

    expect(
      taskDueInputValue("2026-10-19T09:00:00.000Z", { dueTimeZone: null, dueAllDay: false }),
    ).toEqual({ value: "2026-10-19T09:00", allDay: false });

    expect(
      buildCalendarEventWhen({
        dueAt: new Date("2026-10-19T09:00:00.000Z"),
        dueTimeZone: null,
        dueAllDay: false,
        viewerTimeZone: HALIFAX,
      }),
    ).toEqual({
      start: { dateTime: "2026-10-19T09:00:00", timeZone: HALIFAX },
      end: { dateTime: "2026-10-19T10:00:00", timeZone: HALIFAX },
    });
  });

  it("does not mark a legacy 9:00 AM overdue at 8:00 AM Halifax", () => {
    const due = { dueAt: new Date("2026-10-19T09:00:00.000Z"), dueTimeZone: null, dueAllDay: false };
    expect(isTaskOverdue(due, new Date("2026-10-19T11:00:00.000Z"), HALIFAX)).toBe(false);
    expect(isTaskOverdue(due, new Date("2026-10-19T13:00:00.000Z"), HALIFAX)).toBe(true);
  });

  it("keeps date-only dues on that civil date and creates an all-day event", () => {
    const parsed = parseTaskDueInput("2026-10-19", { timeZone: HALIFAX });
    expect(parsed?.dueAllDay).toBe(true);
    expect(parsed?.dueAt.toISOString()).toBe("2026-10-19T00:00:00.000Z");

    const label = formatTaskDuePrimary(
      { dueAt: parsed!.dueAt, dueTimeZone: HALIFAX, dueAllDay: true },
      "en",
    );
    expect(spaces(label)).toContain("Oct 19, 2026");
    expect(label).not.toMatch(/AM|PM/);

    expect(
      buildCalendarEventWhen({
        dueAt: parsed!.dueAt,
        dueTimeZone: HALIFAX,
        dueAllDay: true,
        viewerTimeZone: HALIFAX,
        now: new Date("2026-10-18T12:00:00.000Z"),
      }),
    ).toEqual({
      start: { date: "2026-10-19" },
      end: { date: "2026-10-20" },
    });

    const legacyTemplate = {
      dueAt: new Date("2026-10-19T00:00:00.000Z"),
      dueTimeZone: null,
      dueAllDay: false,
    };
    expect(formatTaskDuePrimary(legacyTemplate, "en")).not.toMatch(/AM|PM/);
    expect(spaces(formatTaskDuePrimary(legacyTemplate, "en"))).toContain("Oct 19, 2026");
    expect(
      buildCalendarEventWhen({ ...legacyTemplate, viewerTimeZone: HALIFAX }),
    ).toEqual({
      start: { date: "2026-10-19" },
      end: { date: "2026-10-20" },
    });
  });

  it("uses the viewer's today for an all-day event when the task has no due", () => {
    expect(
      buildCalendarEventWhen({
        dueAt: null,
        viewerTimeZone: HALIFAX,
        now: new Date("2026-10-19T02:00:00.000Z"),
      }),
    ).toEqual({
      start: { date: "2026-10-18" },
      end: { date: "2026-10-19" },
    });
  });

  it("does not mark an all-day date overdue the evening before in Halifax", () => {
    const due = { dueAt: new Date("2026-10-19T00:00:00.000Z"), dueTimeZone: HALIFAX, dueAllDay: true };
    expect(isTaskOverdue(due, new Date("2026-10-19T02:00:00.000Z"), HALIFAX)).toBe(false);
    expect(isTaskOverdue(due, new Date("2026-10-20T03:00:00.000Z"), HALIFAX)).toBe(true);
  });

  it("keeps 9:00 AM local when a daily task crosses the Halifax DST fallback", () => {
    const next = advanceTaskDueDate(new Date("2026-10-31T12:00:00.000Z"), "daily", new Date("2026-10-31T12:00:00.000Z"), {
      timeZone: HALIFAX,
      allDay: false,
    });
    expect(next.toISOString()).toBe("2026-11-01T13:00:00.000Z");
    expect(
      spaces(
        formatTaskDuePrimary({ dueAt: next, dueTimeZone: HALIFAX, dueAllDay: false }, "en"),
      ),
    ).toContain("9:00 AM");
  });

  it("advances an all-day date by one civil day", () => {
    const next = advanceTaskDueDate(new Date("2026-10-19T00:00:00.000Z"), "daily", new Date(), {
      timeZone: HALIFAX,
      allDay: true,
    });
    expect(next.toISOString()).toBe("2026-10-20T00:00:00.000Z");
  });
});
