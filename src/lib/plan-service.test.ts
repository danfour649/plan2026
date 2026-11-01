import { beforeEach, describe, expect, it, vi } from "vitest";

const { taskUpdateMany, taskCreateMany, planUpdateMany, planFindFirst } = vi.hoisted(() => ({
  taskUpdateMany: vi.fn(async () => ({ count: 0 })),
  taskCreateMany: vi.fn(async () => ({ count: 0 })),
  planUpdateMany: vi.fn(async () => ({ count: 1 })),
  planFindFirst: vi.fn(async () => ({ id: "plan1", userId: "user1", tasks: [] as unknown[] })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: async (cb: (tx: unknown) => unknown) =>
      cb({
        plan: { updateMany: planUpdateMany },
        task: { updateMany: taskUpdateMany, createMany: taskCreateMany },
      }),
    plan: { findFirst: planFindFirst },
  },
}));

vi.mock("@vercel/blob", () => ({ del: vi.fn(async () => undefined) }));

vi.mock("@/lib/task-service", () => ({
  deleteAllTasksForPlan: vi.fn(async () => undefined),
}));

import { updatePlanForUser } from "./plan-service";
import { updatePlanSchema } from "./validations/plan";

function parseUpdate(extra: Record<string, unknown> = {}) {
  const parsed = updatePlanSchema.safeParse({
    planId: "plan1",
    name: "Plan",
    startAt: "2026-11-01",
    endAt: "2026-11-30",
    priority: 4,
    percentCompleted: 93,
    status: "started",
    ...extra,
  });
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.flatten()));
  return parsed.data;
}

describe("updatePlanForUser taskIds semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    planUpdateMany.mockResolvedValue({ count: 1 });
    planFindFirst.mockResolvedValue({ id: "plan1", userId: "user1", tasks: [] });
  });

  it("omitted taskIds leaves the plan's task links untouched", async () => {
    const data = parseUpdate();
    expect(data.taskIds).toBeUndefined();

    const result = await updatePlanForUser("user1", data);

    expect("plan" in result).toBe(true);
    expect(planUpdateMany).toHaveBeenCalledTimes(1);
    expect(taskUpdateMany).not.toHaveBeenCalled();
  });

  it("an explicit empty taskIds unlinks every task from the plan", async () => {
    const data = parseUpdate({ taskIds: [] });

    await updatePlanForUser("user1", data);

    expect(taskUpdateMany).toHaveBeenCalledTimes(1);
    expect(taskUpdateMany).toHaveBeenCalledWith({
      where: { userId: "user1", planId: "plan1" },
      data: { planId: null },
    });
  });

  it("a provided taskIds relinks exactly that set", async () => {
    const data = parseUpdate({ taskIds: ["t1", "t2"] });

    await updatePlanForUser("user1", data);

    expect(taskUpdateMany).toHaveBeenCalledTimes(2);
    expect(taskUpdateMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: ["t1", "t2"] }, userId: "user1" },
      data: { planId: "plan1" },
    });
  });
});
