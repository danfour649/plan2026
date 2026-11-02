import { describe, expect, it } from "vitest";

import { mergeTaskUpdate, type TaskCurrentFields } from "./task";

const current: TaskCurrentFields = {
  title: "Write the thing",
  content: "Important notes",
  dueAt: "2026-11-05T00:00:00.000Z",
  dueTimeZone: "America/Halifax",
  dueAllDay: false,
  urgency: 7,
  status: "on_hold",
  recurrence: "weekly",
};

describe("mergeTaskUpdate", () => {
  it("title-only patch keeps urgency, due date, content, status and recurrence", () => {
    const merged = mergeTaskUpdate(current, { title: "Renamed" });
    expect(merged).toEqual({
      title: "Renamed",
      content: "Important notes",
      dueAt: "2026-11-05T00:00:00.000Z",
      timeZone: "America/Halifax",
      dueAllDay: false,
      urgency: 7,
      status: "on_hold",
      recurrence: "weekly",
    });
  });

  it("empty patch is a no-op over the current values", () => {
    const merged = mergeTaskUpdate(current, {});
    expect(merged.title).toBe(current.title);
    expect(merged.content).toBe(current.content);
    expect(merged.dueAt).toBe(current.dueAt);
    expect(merged.urgency).toBe(7);
    expect(merged.status).toBe("on_hold");
    expect(merged.recurrence).toBe("weekly");
  });

  it("provided fields win over current values", () => {
    const merged = mergeTaskUpdate(current, { urgency: 2, status: "active" });
    expect(merged.urgency).toBe(2);
    expect(merged.status).toBe("active");
    expect(merged.dueAt).toBe(current.dueAt);
  });

  it("an explicit empty string is passed through so the update can clear content/due date", () => {
    const merged = mergeTaskUpdate(current, { content: "", dueAt: "" });
    expect(merged.content).toBe("");
    expect(merged.dueAt).toBe("");
  });

  it("a completed task yields the active placeholder status (the service keeps it completed)", () => {
    const merged = mergeTaskUpdate({ ...current, status: "completed" }, { title: "Retitle" });
    expect(merged.status).toBe("active");
    expect(merged.urgency).toBe(7);
  });

  it("null-valued current fields stay unset when omitted", () => {
    const merged = mergeTaskUpdate(
      { ...current, content: null, dueAt: null, dueTimeZone: null, recurrence: null },
      { title: "Retitle" },
    );
    expect(merged.content).toBeUndefined();
    expect(merged.dueAt).toBeUndefined();
    expect(merged.timeZone).toBeUndefined();
    expect(merged.recurrence).toBeUndefined();
  });
});
