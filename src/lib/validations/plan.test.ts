import { describe, expect, it } from "vitest";

import {
  formatPlanStatus,
  PLAN_STATUS_VALUES,
  createPlanSchema,
  updatePlanSchema,
  planIdSchema,
  PLAN_PRIORITY_MIN,
  PLAN_PRIORITY_MAX,
  PLAN_PERCENT_MIN,
  PLAN_PERCENT_MAX,
} from "./plan";

describe("formatPlanStatus", () => {
  it("formats on_hold as On hold", () => {
    expect(formatPlanStatus("on_hold")).toBe("On hold");
  });

  it("capitalizes first letter for other statuses", () => {
    expect(formatPlanStatus("draft")).toBe("Draft");
    expect(formatPlanStatus("started")).toBe("Started");
    expect(formatPlanStatus("completed")).toBe("Completed");
    expect(formatPlanStatus("abandoned")).toBe("Abandoned");
  });
});

describe("plan constants", () => {
  it("PLAN_STATUS_VALUES includes expected statuses", () => {
    expect(PLAN_STATUS_VALUES).toContain("draft");
    expect(PLAN_STATUS_VALUES).toContain("started");
    expect(PLAN_STATUS_VALUES).toContain("on_hold");
    expect(PLAN_STATUS_VALUES).toContain("completed");
    expect(PLAN_STATUS_VALUES).toContain("abandoned");
    expect(PLAN_STATUS_VALUES).toHaveLength(5);
  });
});

describe("planIdSchema", () => {
  it("parses non-empty planId", () => {
    const result = planIdSchema.safeParse({ planId: "c012345678901234567890123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.planId).toBe("c012345678901234567890123");
  });

  it("rejects empty planId", () => {
    const result = planIdSchema.safeParse({ planId: "" });
    expect(result.success).toBe(false);
  });
});

describe("createPlanSchema", () => {
  const validBase = {
    name: "My plan",
    startAt: "2026-06-01",
    endAt: "2026-06-30",
    priority: PLAN_PRIORITY_MIN,
    percentCompleted: PLAN_PERCENT_MIN,
  };

  it("parses valid minimal create input", () => {
    const result = createPlanSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects endAt before startAt", () => {
    const result = createPlanSchema.safeParse({
      ...validBase,
      startAt: "2026-06-30",
      endAt: "2026-06-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts priority in range", () => {
    expect(createPlanSchema.safeParse({ ...validBase, priority: PLAN_PRIORITY_MAX }).success).toBe(true);
  });

  it("accepts percentCompleted in range", () => {
    expect(createPlanSchema.safeParse({ ...validBase, percentCompleted: PLAN_PERCENT_MAX }).success).toBe(true);
  });
});

describe("updatePlanSchema", () => {
  const validBase = {
    planId: "c012345678901234567890123",
    name: "Updated plan",
    startAt: "2026-06-01",
    endAt: "2026-06-30",
    priority: 1,
    percentCompleted: 50,
    status: "started",
  };

  it("parses valid update input with status", () => {
    const result = updatePlanSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts all PLAN_STATUS_VALUES for status", () => {
    for (const status of PLAN_STATUS_VALUES) {
      const result = updatePlanSchema.safeParse({ ...validBase, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = updatePlanSchema.safeParse({ ...validBase, status: "invalid" });
    expect(result.success).toBe(false);
  });
});
