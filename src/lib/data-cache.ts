/**
 * Server-side data cache using Next.js unstable_cache + revalidateTag.
 * Cached data is reused when navigating between pages; mutations call
 * revalidateTag() so the next request gets fresh data.
 *
 * Cache keys include userId (and page params where relevant) so data is
 * isolated per user. Tags use the pattern `{domain}-{userId}` so actions
 * can invalidate with revalidateTag(`plans-${userId}`) etc.
 *
 * Cached results are serialized by Next.js, so Date fields become strings.
 * We rehydrate them after reading from cache so consumers always get Date instances.
 */

import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ARCHIVED_STATUSES = ["completed", "abandoned"] as const;

/** Turn a cache-deserialized value back into a Date (cache stores dates as ISO strings). */
function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  return v as Date;
}

export type NavCounts = {
  remainingTaskCount: number;
  activePlanCount: number;
  suppliesCount: number;
};

function navCountsTag(userId: string): string {
  return `nav-${userId}`;
}

export function getNavCountsCacheTag(userId: string): string {
  return navCountsTag(userId);
}

export function getPlansCacheTag(userId: string): string {
  return `plans-${userId}`;
}

export function getTasksCacheTag(userId: string): string {
  return `tasks-${userId}`;
}

export function getSuppliesCacheTag(userId: string): string {
  return `supplies-${userId}`;
}

export function getPlanDetailCacheTag(planId: string): string {
  return `plan-${planId}`;
}

// Shared remaining-task count so layout (nav badge) and tasks page (pagination) don't run it twice
async function fetchRemainingTaskCount(userId: string): Promise<number> {
  return prisma.task.count({
    where: { userId, status: { not: TaskStatus.completed } },
  });
}

export function getCachedRemainingTaskCount(userId: string): Promise<number> {
  return unstable_cache(
    () => fetchRemainingTaskCount(userId),
    ["remaining-task-count", userId],
    { tags: [navCountsTag(userId)] },
  )();
}

async function fetchActivePlanCount(userId: string): Promise<number> {
  return prisma.plan.count({
    where: {
      userId,
      status: { notIn: [...ARCHIVED_STATUSES] },
    },
  });
}

function getCachedActivePlanCount(userId: string): Promise<number> {
  return unstable_cache(
    () => fetchActivePlanCount(userId),
    ["active-plan-count", userId],
    { tags: [navCountsTag(userId)] },
  )();
}

async function fetchSuppliesCount(userId: string): Promise<number> {
  return prisma.supplyItem.count({
    where: {
      plan: {
        OR: [
          { userId },
          { shares: { some: { sharedWithUserId: userId } } },
        ],
      },
    },
  });
}

function getCachedSuppliesCount(userId: string): Promise<number> {
  return unstable_cache(
    () => fetchSuppliesCount(userId),
    ["supplies-count", userId],
    { tags: [navCountsTag(userId)] },
  )();
}

export async function getCachedNavCounts(userId: string): Promise<NavCounts> {
  const [remainingTaskCount, activePlanCount, suppliesCount] = await Promise.all([
    getCachedRemainingTaskCount(userId),
    getCachedActivePlanCount(userId),
    getCachedSuppliesCount(userId),
  ]);
  return { remainingTaskCount, activePlanCount, suppliesCount };
}

// Plans list: used by /plans page
type PlanWhereInput = Prisma.PlanWhereInput;

async function fetchPlansPage(
  userId: string,
  showArchived: boolean,
  page: number,
  limit: number,
) {
  const baseWhere: PlanWhereInput = {
    OR: [
      { userId },
      { shares: { some: { sharedWithUserId: userId } } },
    ],
  };
  const where: PlanWhereInput = showArchived
    ? baseWhere
    : { ...baseWhere, status: { notIn: [...ARCHIVED_STATUSES] } };

  const [plans, totalPlans] = await Promise.all([
    prisma.plan.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { tasks: { select: { id: true, status: true } } },
    }),
    prisma.plan.count({ where }),
  ]);
  return { plans, totalPlans };
}

function rehydratePlan<T extends { startAt: unknown; endAt: unknown; actualStartAt?: unknown; actualEndAt?: unknown; createdAt: unknown; updatedAt: unknown; tasks?: Array<{ id: unknown; status: unknown }> }>(
  p: T,
): T {
  return {
    ...p,
    startAt: toDate(p.startAt),
    endAt: toDate(p.endAt),
    actualStartAt: p.actualStartAt != null ? toDate(p.actualStartAt) : null,
    actualEndAt: p.actualEndAt != null ? toDate(p.actualEndAt) : null,
    createdAt: toDate(p.createdAt),
    updatedAt: toDate(p.updatedAt),
    tasks: p.tasks?.map((t) => ({ ...t })),
  } as T;
}

export async function getCachedPlansPage(
  userId: string,
  showArchived: boolean,
  page: number,
  limit: number,
) {
  const result = await unstable_cache(
    () => fetchPlansPage(userId, showArchived, page, limit),
    ["plans-page", userId, String(showArchived), String(page), String(limit)],
    { tags: [getPlansCacheTag(userId)] },
  )();
  return { plans: result.plans.map(rehydratePlan), totalPlans: result.totalPlans };
}

// Tasks list: remaining + optional completed
const taskInclude = {
  plan: { select: { id: true, name: true } },
  attachments: { select: { id: true, url: true, filename: true, size: true } },
} as const;

/** Task shape returned by getCachedTasksPage (includes status, plan, attachments). */
export type CachedTasksPageTask = {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  dueAt: Date | null;
  urgency: number;
  googleCalendarEventId: string | null;
  googleCalendarEventUrl: string | null;
  status: import("@prisma/client").TaskStatus;
  completedAt: Date | null;
  planId: string | null;
  createdAt: Date;
  updatedAt: Date;
  plan: { id: string; name: string } | null;
  attachments: { id: string; url: string; filename: string; size: number }[];
};

async function fetchTasksPage(
  userId: string,
  showCompleted: boolean,
  page: number,
  limit: number,
  completedPage: number,
) {
  const remainingWhere = { userId, status: { not: TaskStatus.completed } };
  const [remainingTasks, totalRemaining] = await Promise.all([
    prisma.task.findMany({
      where: remainingWhere,
      orderBy: [{ status: "asc" }, { urgency: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: taskInclude,
    }),
    getCachedRemainingTaskCount(userId),
  ]);

  const completedWhere = { userId, status: TaskStatus.completed };
  const [completedTasks, totalCompleted] = showCompleted
    ? await Promise.all([
        prisma.task.findMany({
          where: completedWhere,
          orderBy: [{ urgency: "desc" }, { completedAt: "desc" }],
          skip: (completedPage - 1) * limit,
          take: limit,
          include: taskInclude,
        }),
        prisma.task.count({ where: completedWhere }),
      ])
    : [[], 0];

  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return {
    remainingTasks,
    totalRemaining,
    completedTasks,
    totalCompleted,
    plans,
  };
}

function rehydrateTask<T extends { dueAt?: unknown; completedAt?: unknown; status?: unknown; createdAt: unknown; updatedAt: unknown }>(
  t: T,
): T {
  return {
    ...t,
    dueAt: t.dueAt != null ? toDate(t.dueAt) : null,
    completedAt: t.completedAt != null ? toDate(t.completedAt) : null,
    createdAt: toDate(t.createdAt),
    updatedAt: toDate(t.updatedAt),
  } as T;
}

export async function getCachedTasksPage(
  userId: string,
  showCompleted: boolean,
  page: number,
  limit: number,
  completedPage: number,
): Promise<{
  remainingTasks: CachedTasksPageTask[];
  totalRemaining: number;
  completedTasks: CachedTasksPageTask[];
  totalCompleted: number;
  plans: { id: string; name: string }[];
}> {
  const result = await unstable_cache(
    () => fetchTasksPage(userId, showCompleted, page, limit, completedPage),
    [
      "tasks-page",
      userId,
      String(showCompleted),
      String(page),
      String(limit),
      String(completedPage),
    ],
    { tags: [getTasksCacheTag(userId), getPlansCacheTag(userId)] },
  )();
  return {
    remainingTasks: result.remainingTasks.map(rehydrateTask) as CachedTasksPageTask[],
    totalRemaining: result.totalRemaining,
    completedTasks: result.completedTasks.map(rehydrateTask) as CachedTasksPageTask[],
    totalCompleted: result.totalCompleted,
    plans: result.plans,
  };
}

// Actions page: urgent (urgency >= 6) or due within 3 days, incomplete only; sort overdue first, then due date, then urgency
const ACTIONS_URGENCY_MIN = 6;

function getActionsDateRange(): { startOfToday: Date; endOfThreeDays: Date } {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfThreeDays = new Date(startOfToday);
  endOfThreeDays.setUTCDate(endOfThreeDays.getUTCDate() + 4); // exclusive end of day 3
  return { startOfToday, endOfThreeDays };
}

async function fetchActionsPage(userId: string) {
  const { endOfThreeDays } = getActionsDateRange();
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: TaskStatus.completed },
      OR: [
        { urgency: { gte: ACTIONS_URGENCY_MIN } },
        { dueAt: { lt: endOfThreeDays } },
      ],
    },
    orderBy: [{ status: "asc" }, { urgency: "desc" }, { createdAt: "desc" }],
    include: taskInclude,
  });
  const now = new Date();
  const sorted = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    const aDue = a.dueAt != null ? toDate(a.dueAt) : null;
    const bDue = b.dueAt != null ? toDate(b.dueAt) : null;
    const aOverdue = aDue !== null && aDue < now;
    const bOverdue = bDue !== null && bDue < now;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (aDue && bDue) return aDue.getTime() - bDue.getTime();
    if (aDue) return -1;
    if (bDue) return 1;
    return b.urgency - a.urgency;
  });
  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return { tasks: sorted, plans };
}

export async function getCachedActionsPage(userId: string) {
  const { startOfToday } = getActionsDateRange();
  const dateKey = startOfToday.toISOString().slice(0, 10);
  const result = await unstable_cache(
    () => fetchActionsPage(userId),
    ["actions-page", userId, dateKey],
    { tags: [getTasksCacheTag(userId), getPlansCacheTag(userId)] },
  )();
  return {
    tasks: result.tasks.map(rehydrateTask),
    plans: result.plans,
  };
}

// Plan detail page: plan + supplyItems + tasks (paginated + export) + dropdowns
const PLAN_TASKS_ORDER = [
  { status: "asc" as const },
  { completedAt: "desc" as const },
  { urgency: "desc" as const },
  { createdAt: "desc" as const },
] as const;

const planDetailTaskSelect = {
  id: true,
  title: true,
  content: true,
  dueAt: true,
  urgency: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function fetchPlanDetail(
  planId: string,
  userId: string,
  taskPage: number,
  taskLimit: number,
) {
  const [plan, planTasks, totalPlanTasks, exportTasks] = await Promise.all([
    prisma.plan.findFirst({
      where: {
        id: planId,
        OR: [
          { userId },
          { shares: { some: { sharedWithUserId: userId } } },
        ],
      },
      include: {
        supplyItems: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
    prisma.task.findMany({
      where: { planId },
      orderBy: [...PLAN_TASKS_ORDER],
      skip: (taskPage - 1) * taskLimit,
      take: taskLimit,
      select: {
        ...planDetailTaskSelect,
        attachments: {
          select: { id: true, url: true, filename: true, size: true },
        },
      },
    }),
    prisma.task.count({ where: { planId } }),
    prisma.task.findMany({
      where: { planId },
      orderBy: [...PLAN_TASKS_ORDER],
      select: planDetailTaskSelect,
    }),
  ]);
  return { plan, planTasks, totalPlanTasks, exportTasks };
}

function rehydratePlanWithSupplyItems<
  T extends {
    startAt: unknown;
    endAt: unknown;
    actualStartAt?: unknown;
    actualEndAt?: unknown;
    createdAt: unknown;
    updatedAt: unknown;
    supplyItems?: Array<{ createdAt?: unknown }>;
  },
>(p: T): T {
  return {
    ...p,
    startAt: toDate(p.startAt),
    endAt: toDate(p.endAt),
    actualStartAt: p.actualStartAt != null ? toDate(p.actualStartAt) : null,
    actualEndAt: p.actualEndAt != null ? toDate(p.actualEndAt) : null,
    createdAt: toDate(p.createdAt),
    updatedAt: toDate(p.updatedAt),
    supplyItems: p.supplyItems?.map((s) => ({
      ...s,
      createdAt: s.createdAt != null ? toDate(s.createdAt) : undefined,
    })),
  } as T;
}

export async function getCachedPlanDetail(
  planId: string,
  userId: string,
  taskPage: number,
  taskLimit: number,
) {
  const result = await unstable_cache(
    () => fetchPlanDetail(planId, userId, taskPage, taskLimit),
    ["plan-detail", planId, userId, String(taskPage), String(taskLimit)],
    { tags: [getPlanDetailCacheTag(planId)] },
  )();
  return {
    plan: result.plan ? rehydratePlanWithSupplyItems(result.plan) : null,
    planTasks: result.planTasks.map(rehydrateTask),
    totalPlanTasks: result.totalPlanTasks,
    exportTasks: result.exportTasks.map(rehydrateTask),
  };
}

async function fetchPlansForDropdown(userId: string) {
  return prisma.plan.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

export async function getCachedPlansForDropdown(userId: string) {
  return unstable_cache(
    () => fetchPlansForDropdown(userId),
    ["plans-dropdown", userId],
    { tags: [getPlansCacheTag(userId)] },
  )();
}

async function fetchUserTasksForDropdown(userId: string) {
  return prisma.task.findMany({
    where: { userId, status: { not: TaskStatus.completed } },
    orderBy: [{ status: "asc" }, { urgency: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true },
  });
}

export async function getCachedUserTasksForDropdown(userId: string) {
  return unstable_cache(
    () => fetchUserTasksForDropdown(userId),
    ["user-tasks-dropdown", userId],
    { tags: [getTasksCacheTag(userId)] },
  )();
}

// Supplies page
async function fetchSuppliesPage(userId: string) {
  const plansWithSupplies = await prisma.plan.findMany({
    where: {
      OR: [
        { userId },
        { shares: { some: { sharedWithUserId: userId } } },
      ],
      supplyItems: { some: {} },
    },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    include: {
      supplyItems: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  return { plansWithSupplies };
}

function rehydrateSupplyItem<T extends { createdAt?: unknown; updatedAt?: unknown }>(s: T): T {
  return {
    ...s,
    createdAt: s.createdAt != null ? toDate(s.createdAt) : undefined,
    updatedAt: s.updatedAt != null ? toDate(s.updatedAt) : undefined,
  } as T;
}

function rehydratePlanWithSupplies<T extends { createdAt: unknown; updatedAt: unknown; supplyItems?: Array<{ createdAt?: unknown; updatedAt?: unknown }> }>(
  p: T,
): T {
  return {
    ...p,
    createdAt: toDate(p.createdAt),
    updatedAt: toDate(p.updatedAt),
    supplyItems: p.supplyItems?.map(rehydrateSupplyItem),
  } as T;
}

export async function getCachedSuppliesPage(userId: string) {
  const result = await unstable_cache(
    () => fetchSuppliesPage(userId),
    ["supplies-page", userId],
    { tags: [getSuppliesCacheTag(userId)] },
  )();
  return {
    plansWithSupplies: result.plansWithSupplies.map(rehydratePlanWithSupplies),
  };
}
