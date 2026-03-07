import { describe, expect, it } from "vitest";

import {
  isValidTaskId,
  taskIdSchema,
  addTaskSchema,
  TASK_URGENCY_MIN,
  TASK_URGENCY_MAX,
} from "./task";

describe("isValidTaskId", () => {
  it("returns true for valid 25-char CUID", () => {
    expect(isValidTaskId("c012345678901234567890123")).toBe(true);
    expect(isValidTaskId("c" + "a".repeat(24))).toBe(true);
  });

  it("returns false for wrong length", () => {
    expect(isValidTaskId("c123")).toBe(false);
    expect(isValidTaskId("c0123456789012345678901234")).toBe(false);
  });

  it("returns false when missing c prefix", () => {
    expect(isValidTaskId("a012345678901234567890123")).toBe(false);
  });

  it("returns false for non-string", () => {
    expect(isValidTaskId("")).toBe(false);
  });
});

describe("taskIdSchema", () => {
  it("parses valid taskId", () => {
    const result = taskIdSchema.safeParse({ taskId: "c012345678901234567890123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.taskId).toBe("c012345678901234567890123");
  });

  it("rejects empty taskId", () => {
    const result = taskIdSchema.safeParse({ taskId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid format", () => {
    const result = taskIdSchema.safeParse({ taskId: "not-a-cuid" });
    expect(result.success).toBe(false);
  });
});

describe("addTaskSchema", () => {
  it("parses valid minimal task (title only)", () => {
    const result = addTaskSchema.safeParse({ title: " Do something ", urgency: 4 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Do something");
      expect(result.data.urgency).toBe(4);
    }
  });

  it("trims title", () => {
    const result = addTaskSchema.safeParse({ title: "  trimmed  ", urgency: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("trimmed");
  });

  it("rejects empty title", () => {
    const result = addTaskSchema.safeParse({ title: "", urgency: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects urgency below min", () => {
    const result = addTaskSchema.safeParse({ title: "x", urgency: TASK_URGENCY_MIN - 1 });
    expect(result.success).toBe(false);
  });

  it("rejects urgency above max", () => {
    const result = addTaskSchema.safeParse({ title: "x", urgency: TASK_URGENCY_MAX + 1 });
    expect(result.success).toBe(false);
  });

  it("accepts valid planId CUID", () => {
    const result = addTaskSchema.safeParse({
      title: "Task",
      urgency: 1,
      planId: "c012345678901234567890123",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.planId).toBe("c012345678901234567890123");
  });

  it("rejects invalid planId", () => {
    const result = addTaskSchema.safeParse({ title: "Task", urgency: 1, planId: "invalid" });
    expect(result.success).toBe(false);
  });
});
