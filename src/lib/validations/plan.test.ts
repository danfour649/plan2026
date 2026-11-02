import { describe, expect, it } from "vitest";

import { createPlanSchema, mergePlanUpdate, type PlanCurrentFields } from "./plan";

const current: PlanCurrentFields = {
  name: "MVTF6 — MVT Fredericton",
  description: "A plan",
  goal: null,
  startAt: "2026-11-01T00:00:00.000Z",
  endAt: "2026-11-30T00:00:00.000Z",
  actualStartAt: null,
  actualEndAt: null,
  priority: 7,
  percentCompleted: 93,
  notes: "Some notes",
  color: null,
  imageUrl: null,
  status: "started",
};

describe("mergePlanUpdate", () => {
  it("percent-only patch keeps every other field at its current value", () => {
    const merged = mergePlanUpdate(current, { percentCompleted: 95 });
    expect(merged).toEqual({
      name: current.name,
      description: current.description,
      goal: undefined,
      startAt: current.startAt,
      endAt: current.endAt,
      actualStartAt: undefined,
      actualEndAt: undefined,
      priority: 7,
      percentCompleted: 95,
      notes: current.notes,
      color: undefined,
      imageUrl: undefined,
      status: "started",
    });
  });

  it("priority-only patch does not reset percentCompleted or status to defaults", () => {
    const merged = mergePlanUpdate(current, { priority: 3 });
    expect(merged.priority).toBe(3);
    expect(merged.percentCompleted).toBe(93);
    expect(merged.status).toBe("started");
    expect(merged.name).toBe(current.name);
  });

  it("empty patch is a no-op over the current values", () => {
    const merged = mergePlanUpdate(current, {});
    expect(merged.name).toBe(current.name);
    expect(merged.startAt).toBe(current.startAt);
    expect(merged.endAt).toBe(current.endAt);
    expect(merged.priority).toBe(current.priority);
    expect(merged.percentCompleted).toBe(current.percentCompleted);
    expect(merged.status).toBe(current.status);
    expect(merged.notes).toBe(current.notes);
  });

  it("provided fields win over current values", () => {
    const merged = mergePlanUpdate(current, {
      name: "Renamed",
      status: "on_hold",
      startAt: "2026-12-01T00:00:00.000Z",
      notes: "New notes",
    });
    expect(merged.name).toBe("Renamed");
    expect(merged.status).toBe("on_hold");
    expect(merged.startAt).toBe("2026-12-01T00:00:00.000Z");
    expect(merged.notes).toBe("New notes");
    expect(merged.endAt).toBe(current.endAt);
  });
});

describe("createPlanSchema status", () => {
  const baseInput = {
    name: "New plan",
    startAt: "2026-11-02",
    endAt: "2026-11-09",
    priority: 4,
    percentCompleted: 0,
    taskIds: [],
    newTasks: [],
  };

  it("defaults status to draft when omitted", () => {
    const parsed = createPlanSchema.safeParse(baseInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.status).toBe("draft");
  });

  it("honors a provided status instead of dropping it", () => {
    const parsed = createPlanSchema.safeParse({ ...baseInput, status: "started" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.status).toBe("started");
  });

  it("rejects an unknown status", () => {
    const parsed = createPlanSchema.safeParse({ ...baseInput, status: "bogus" });
    expect(parsed.success).toBe(false);
  });
});
