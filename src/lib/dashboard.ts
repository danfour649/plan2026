import { prisma } from "@/lib/prisma";

export type PlanProgressInput = {
  totalTaskCount: number;
  completedTaskCount: number;
  percentCompleted: number;
};

export type PlansSummary = {
  activePlans: number;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  overallPercent: number;
};

/**
 * Overall completion across plans. Weighted by task counts when any plan has
 * tasks (the honest "how much work is done" number); falls back to the mean of
 * the plans' own percentCompleted when no plan has tasks yet.
 */
export function computeOverallPercent(plans: readonly PlanProgressInput[]): number {
  const total = plans.reduce((acc, p) => acc + p.totalTaskCount, 0);
  const completed = plans.reduce((acc, p) => acc + p.completedTaskCount, 0);
  if (total > 0) return Math.round((completed / total) * 100);
  if (plans.length === 0) return 0;
  const mean = plans.reduce((acc, p) => acc + p.percentCompleted, 0) / plans.length;
  return Math.round(mean);
}

export function summarizePlans(plans: readonly PlanProgressInput[]): PlansSummary {
  const totalTasks = plans.reduce((acc, p) => acc + p.totalTaskCount, 0);
  const completedTasks = plans.reduce((acc, p) => acc + p.completedTaskCount, 0);
  return {
    activePlans: plans.length,
    totalTasks,
    completedTasks,
    remainingTasks: totalTasks - completedTasks,
    overallPercent: computeOverallPercent(plans),
  };
}

export type UpcomingTask = {
  id: string;
  title: string;
  dueAt: Date;
  planName: string | null;
};

export type DashboardTaskStats = {
  completedLast7Days: number;
  dueNext7Days: number;
  upcoming: UpcomingTask[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Task-side dashboard aggregates for one user (rolling 7-day windows). */
export async function getDashboardTaskStats(
  userId: string,
  now = new Date(),
): Promise<DashboardTaskStats> {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const inSevenDays = new Date(now.getTime() + 7 * DAY_MS);

  const [completedLast7Days, dueNext7Days, upcomingRows] = await Promise.all([
    prisma.task.count({ where: { userId, completedAt: { gte: weekAgo } } }),
    prisma.task.count({
      where: { userId, status: "active", dueAt: { gt: now, lte: inSevenDays } },
    }),
    prisma.task.findMany({
      where: { userId, status: "active", dueAt: { not: null, lte: inSevenDays } },
      orderBy: { dueAt: "asc" },
      take: 5,
      select: { id: true, title: true, dueAt: true, plan: { select: { name: true } } },
    }),
  ]);

  return {
    completedLast7Days,
    dueNext7Days,
    upcoming: upcomingRows
      .filter((row): row is typeof row & { dueAt: Date } => row.dueAt != null)
      .map((row) => ({
        id: row.id,
        title: row.title,
        dueAt: row.dueAt,
        planName: row.plan?.name ?? null,
      })),
  };
}
