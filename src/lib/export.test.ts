import { describe, expect, it } from "vitest";

import {
  buildTasksExportPayload,
  buildPlansExportPayload,
  buildTaskExportPayload,
  buildPlanExportPayload,
  type ExportedTask,
  type ExportedPlan,
} from "./export";

const mockTask: ExportedTask = {
  id: "c012345678901234567890123",
  title: "Test task",
  content: null,
  dueAt: null,
  urgency: 1,
  completedAt: null,
  planId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockPlan: ExportedPlan = {
  id: "c012345678901234567890123",
  name: "Test plan",
  description: null,
  goal: null,
  startAt: "2026-01-01T00:00:00.000Z",
  endAt: "2026-01-31T00:00:00.000Z",
  actualStartAt: null,
  actualEndAt: null,
  status: "draft",
  priority: 1,
  percentCompleted: 0,
  notes: null,
  color: null,
  imageUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("export payload builders", () => {
  it("buildTasksExportPayload returns correct structure and source", () => {
    const payload = buildTasksExportPayload([mockTask]);
    expect(payload.exportedAt).toBeDefined();
    expect(new Date(payload.exportedAt).getTime()).not.toBeNaN();
    expect(payload.source).toBe("plan2026");
    expect(payload.exportType).toBe("tasks");
    expect("tasks" in payload.data && payload.data.tasks).toEqual([mockTask]);
  });

  it("buildPlansExportPayload returns correct structure and source", () => {
    const payload = buildPlansExportPayload([mockPlan]);
    expect(payload.source).toBe("plan2026");
    expect(payload.exportType).toBe("plans");
    expect("plans" in payload.data && payload.data.plans).toEqual([mockPlan]);
  });

  it("buildTaskExportPayload returns single task payload", () => {
    const payload = buildTaskExportPayload(mockTask);
    expect(payload.exportType).toBe("task");
    expect("task" in payload.data && payload.data.task).toEqual(mockTask);
  });

  it("buildPlanExportPayload returns single plan payload", () => {
    const payload = buildPlanExportPayload(mockPlan);
    expect(payload.exportType).toBe("plan");
    expect("plan" in payload.data && payload.data.plan).toEqual(mockPlan);
  });
});
