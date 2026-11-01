import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { computeOverallPercent, summarizePlans } from "./dashboard";

describe("computeOverallPercent", () => {
  it("weights by task counts when plans have tasks", () => {
    expect(
      computeOverallPercent([
        { totalTaskCount: 10, completedTaskCount: 5, percentCompleted: 10 },
        { totalTaskCount: 30, completedTaskCount: 15, percentCompleted: 90 },
      ]),
    ).toBe(50);
  });

  it("rounds to the nearest whole percent", () => {
    expect(
      computeOverallPercent([{ totalTaskCount: 3, completedTaskCount: 2, percentCompleted: 0 }]),
    ).toBe(67);
  });

  it("falls back to the mean percentCompleted when no plan has tasks", () => {
    expect(
      computeOverallPercent([
        { totalTaskCount: 0, completedTaskCount: 0, percentCompleted: 40 },
        { totalTaskCount: 0, completedTaskCount: 0, percentCompleted: 80 },
      ]),
    ).toBe(60);
  });

  it("is 0 when there are no plans", () => {
    expect(computeOverallPercent([])).toBe(0);
  });

  it("is 100 when every task is completed", () => {
    expect(
      computeOverallPercent([{ totalTaskCount: 7, completedTaskCount: 7, percentCompleted: 100 }]),
    ).toBe(100);
  });
});

describe("summarizePlans", () => {
  it("totals tasks and derives the remaining count", () => {
    const summary = summarizePlans([
      { totalTaskCount: 10, completedTaskCount: 4, percentCompleted: 40 },
      { totalTaskCount: 5, completedTaskCount: 5, percentCompleted: 100 },
    ]);
    expect(summary).toEqual({
      activePlans: 2,
      totalTasks: 15,
      completedTasks: 9,
      remainingTasks: 6,
      overallPercent: 60,
    });
  });
});
