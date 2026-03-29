/**
 * Server-side data cache using Next.js Cache Components (`use cache`) + cacheTag +
 * revalidateTag, plus `runtime-rsc-memo` so the same Node process skips repeat Prisma
 * work when dev mode treats framework cache as a miss. Mutations use
 * `revalidate-app-data.ts` to clear memos and revalidateTag().
 *
 * Cache keys include userId (and page params where relevant) so data is
 * isolated per user. Tags use the pattern `{domain}-{userId}` so actions
 * can invalidate with revalidateTag(`plans-${userId}`) etc.
 *
 * Cached results are serialized by Next.js, so Date fields become strings.
 * We rehydrate them after reading from cache so consumers always get Date instances.
 */

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { Prisma, type TaskRecurrence, TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  memoActionsPageKey,
  memoActionsPageResolve,
  memoNavResolve,
  memoPlanListResolve,
  memoPlansPageKey,
  memoPlansPageResolve,
  memoSuppliesPageResolve,
  memoTasksPageKey,
  memoTasksPageResolve,
} from "@/lib/runtime-rsc-memo";

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

/** Plan list (id, name) for dropdowns. Invalidated only when plans are created/updated/deleted, not when tasks change. */
export function getPlanListCacheTag(userId: string): string {
  return `plan-list-${userId}`;
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

/** Single query for all three nav counts (remaining tasks, active plans, supplies). */
export async function fetchNavCountsDirect(userId: string): Promise<NavCounts> {
  return fetchNavCounts(userId);
}

async function fetchNavCounts(userId: string): Promise<NavCounts> {
  const [remainingTaskCount, activePlanCount, suppliesCount] = await Promise.all([
    prisma.task.count({
      where: { userId, status: { not: TaskStatus.completed } },
    }),
    prisma.plan.count({
      where: { userId, status: { notIn: ["completed", "abandoned"] } },
    }),
    prisma.$queryRaw<[{ c: number }]>`
      SELECT COUNT(*)::int AS c FROM "SupplyItem"
      WHERE "planId" IN (
        SELECT id FROM "Plan" WHERE "userId" = ${userId}
        UNION
        SELECT "planId" FROM "PlanShare" WHERE "sharedWithUserId" = ${userId}
      )
    `.then((rows) => Number(rows[0]?.c ?? 0)),
  ]);

  return {
    remainingTaskCount,
    activePlanCount,
    suppliesCount,
  };
}

async function getCachedNavCountsData(userId: string): Promise<NavCounts> {
  "use cache";
  cacheLife("max");
  cacheTag(navCountsTag(userId));
  return fetchNavCounts(userId);
}

async function resolveCachedNavCounts(userId: string): Promise<NavCounts> {
  return memoNavResolve(userId, () => getCachedNavCountsData(userId));
}

export const getCachedNavCounts = cache((userId: string): Promise<NavCounts> => {
  return resolveCachedNavCounts(userId);
});

// Plans list: uses _count for task totals + a single raw query for completed counts,
// instead of fetching every task row per plan.
const plansPageListSelect = {
  id: true,
  userId: true,
  name: true,
  description: true,
  goal: true,
  startAt: true,
  endAt: true,
  actualStartAt: true,
  actualEndAt: true,
  status: true,
  priority: true,
  percentCompleted: true,
  notes: true,
  color: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { tasks: true } },
} satisfies Prisma.PlanSelect;

/** Active-only and all-status pages for the same (page, limit) so the plans list can toggle client-side without a second DB round-trip. */
async function fetchPlansPageBoth(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const baseWhere: Prisma.PlanWhereInput = {
    OR: [{ userId }, { shares: { some: { sharedWithUserId: userId } } }],
  };
  const activeWhere: Prisma.PlanWhereInput = {
    ...baseWhere,
    status: { notIn: ["completed", "abandoned"] },
  };

  const [activeRows, totalActive, allRows, totalAll] = await Promise.all([
    prisma.plan.findMany({
      where: activeWhere,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      select: plansPageListSelect,
    }),
    prisma.plan.count({ where: activeWhere }),
    prisma.plan.findMany({
      where: baseWhere,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      select: plansPageListSelect,
    }),
    prisma.plan.count({ where: baseWhere }),
  ]);

  const allPlanIds = [...new Set([...activeRows, ...allRows].map((p) => p.id))];

  const completedMap = new Map<string, number>();
  if (allPlanIds.length > 0) {
    const rows = await prisma.$queryRaw<{ planId: string; c: number }[]>`
      SELECT "planId", COUNT(*)::int AS c
      FROM "Task"
      WHERE "planId" IN (${Prisma.join(allPlanIds)})
        AND "status" = 'completed'
      GROUP BY "planId"
    `;
    for (const r of rows) completedMap.set(r.planId, r.c);
  }

  const mapRow = (p: (typeof activeRows)[number]) => ({
    ...p,
    totalTaskCount: p._count.tasks,
    completedTaskCount: completedMap.get(p.id) ?? 0,
  });

  return {
    activePlans: activeRows.map(mapRow),
    totalActive,
    allPlans: allRows.map(mapRow),
    totalAll,
  };
}

function rehydratePlan<T extends { startAt: unknown; endAt: unknown; actualStartAt?: unknown; actualEndAt?: unknown; createdAt: unknown; updatedAt: unknown }>(
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
  } as T;
}

async function getCachedPlansPageData(userId: string, page: number, limit: number) {
  "use cache";
  cacheLife("max");
  cacheTag(getPlansCacheTag(userId));
  return fetchPlansPageBoth(userId, page, limit);
}

async function buildCachedPlansPage(userId: string, page: number, limit: number) {
  const result = await getCachedPlansPageData(userId, page, limit);
  return {
    activePlans: result.activePlans.map(rehydratePlan),
    totalActive: result.totalActive,
    allPlans: result.allPlans.map(rehydratePlan),
    totalAll: result.totalAll,
  };
}

export const getCachedPlansPage = cache((userId: string, page: number, limit: number) => {
  const memoKey = memoPlansPageKey(userId, page, limit);
  return memoPlansPageResolve(memoKey, () => buildCachedPlansPage(userId, page, limit));
});

// Tasks list: remaining + optional completed. Attachments are not loaded here; they are fetched when the edit dialog opens.
/** No plan relation: tasks page and actions page attach plan from getCachedPlansForDropdown to avoid a second Plan query (Plan WHERE id IN (...)). */
const taskInclude = {} as const;

/** Task shape returned by getCachedTasksPage (includes status, plan). attachments are always [] from list; edit dialog fetches them on open. */
export type CachedTasksPageTask = {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  dueAt: Date | null;
  recurrence: TaskRecurrence | null;
  urgency: number;
  googleCalendarEventId: string | null;
  googleCalendarEventUrl: string | null;
  status: TaskStatus;
  completedAt: Date | null;
  planId: string | null;
  createdAt: Date;
  updatedAt: Date;
  plan: { id: string; name: string } | null;
  attachments: { id: string; url: string; filename: string; size: number }[];
};

/** Loads remaining + completed slices in one pass so the tasks list can toggle "show completed" client-side without a second DB round-trip. */
async function fetchTasksPage(userId: string, page: number, limit: number, completedPage: number) {
  const remainingWhere = { userId, status: { not: TaskStatus.completed } };
  const completedWhere = { userId, status: TaskStatus.completed };

  const [remainingRows, totalRemaining, completedRows, totalCompleted] = await Promise.all([
    prisma.task.findMany({
      where: remainingWhere,
      orderBy: [{ status: "asc" }, { urgency: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: taskInclude,
    }),
    prisma.task.count({ where: remainingWhere }),
    prisma.task.findMany({
      where: completedWhere,
      orderBy: [{ urgency: "desc" }, { completedAt: "desc" }],
      skip: (completedPage - 1) * limit,
      take: limit,
      include: taskInclude,
    }),
    prisma.task.count({ where: completedWhere }),
  ]);

  const emptyAttachments = [] as { id: string; url: string; filename: string; size: number }[];
  const remainingTasks = remainingRows.map((t) => ({ ...t, attachments: emptyAttachments }));
  const completedTasks = completedRows.map((t) => ({ ...t, attachments: emptyAttachments }));

  return {
    remainingTasks,
    totalRemaining,
    completedTasks,
    totalCompleted,
  };
}

async function getCachedTasksPageData(userId: string, page: number, limit: number, completedPage: number) {
  "use cache";
  cacheLife("max");
  cacheTag(getTasksCacheTag(userId));
  return fetchTasksPage(userId, page, limit, completedPage);
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

async function buildCachedTasksPagePayload(
  userId: string,
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
  const [result, plans] = await Promise.all([
    getCachedTasksPageData(userId, page, limit, completedPage),
    getCachedPlansForDropdown(userId),
  ]);
  const planFor = (planId: string | null): { id: string; name: string } | null =>
    planId ? plans.find((p) => p.id === planId) ?? null : null;
  return {
    remainingTasks: result.remainingTasks.map((t) => ({
      ...rehydrateTask(t),
      plan: planFor(t.planId),
    })) as CachedTasksPageTask[],
    totalRemaining: result.totalRemaining,
    completedTasks: result.completedTasks.map((t) => ({
      ...rehydrateTask(t),
      plan: planFor(t.planId),
    })) as CachedTasksPageTask[],
    totalCompleted: result.totalCompleted,
    plans,
  };
}

export const getCachedTasksPage = cache((
  userId: string,
  page: number,
  limit: number,
  completedPage: number,
): Promise<{
  remainingTasks: CachedTasksPageTask[];
  totalRemaining: number;
  completedTasks: CachedTasksPageTask[];
  totalCompleted: number;
  plans: { id: string; name: string }[];
}> => {
  const memoKey = memoTasksPageKey(userId, page, limit, completedPage);
  return memoTasksPageResolve(memoKey, () => buildCachedTasksPagePayload(userId, page, limit, completedPage));
});

// Actions page: urgent (urgency >= 6) or due within 3 days, incomplete only; sort overdue first, then due date, then urgency
const ACTIONS_URGENCY_MIN = 6;

function getActionsDateRange(): { startOfToday: Date; endOfThreeDays: Date } {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfThreeDays = new Date(startOfToday);
  endOfThreeDays.setUTCDate(endOfThreeDays.getUTCDate() + 4); // exclusive end of day 3
  return { startOfToday, endOfThreeDays };
}

/** UTC day boundaries for the actions list cache key (YYYY-MM-DD). */
function getActionsDateRangeForDay(dateKey: string): { startOfToday: Date; endOfThreeDays: Date } {
  const [y, m, d] = dateKey.split("-").map(Number);
  const startOfToday = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const endOfThreeDays = new Date(startOfToday);
  endOfThreeDays.setUTCDate(endOfThreeDays.getUTCDate() + 4);
  return { startOfToday, endOfThreeDays };
}

async function fetchActionsPage(userId: string, dateKey: string) {
  const { endOfThreeDays } = getActionsDateRangeForDay(dateKey);
  const baseWhere = { userId, status: { not: TaskStatus.completed } } as const;

  const [urgentRows, dueSoonRows] = await Promise.all([
    prisma.task.findMany({
      where: { ...baseWhere, urgency: { gte: ACTIONS_URGENCY_MIN } },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: { ...baseWhere, dueAt: { lt: endOfThreeDays } },
      include: taskInclude,
    }),
  ]);

  const seen = new Set<string>();
  const emptyAttachments = [] as { id: string; url: string; filename: string; size: number }[];
  const merged: typeof urgentRows = [];
  for (const t of [...urgentRows, ...dueSoonRows]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      merged.push(t);
    }
  }

  const now = new Date();
  const withAttachments = merged.map((t) => ({ ...t, attachments: emptyAttachments }));
  const sorted = [...withAttachments].sort((a, b) => {
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
  return { tasks: sorted };
}

async function getCachedActionsPageData(
  userId: string,
  dateKey: string,
): Promise<Awaited<ReturnType<typeof fetchActionsPage>>> {
  "use cache";
  cacheLife("max");
  cacheTag(getTasksCacheTag(userId));
  return fetchActionsPage(userId, dateKey);
}

async function buildCachedActionsPagePayload(
  userId: string,
  dateKey: string,
): Promise<{
  tasks: CachedTasksPageTask[];
  plans: { id: string; name: string }[];
}> {
  const [result, plans] = await Promise.all([
    getCachedActionsPageData(userId, dateKey),
    getCachedPlansForDropdown(userId),
  ]);
  const planFor = (planId: string | null): { id: string; name: string } | null =>
    planId ? plans.find((p) => p.id === planId) ?? null : null;
  return {
    tasks: result.tasks.map((t) => ({
      ...rehydrateTask(t),
      plan: planFor(t.planId),
    })) as CachedTasksPageTask[],
    plans,
  };
}

export const getCachedActionsPage = cache((userId: string): Promise<{
  tasks: CachedTasksPageTask[];
  plans: { id: string; name: string }[];
}> => {
  const { startOfToday } = getActionsDateRange();
  const dateKey = startOfToday.toISOString().slice(0, 10);
  const memoKey = memoActionsPageKey(userId, dateKey);
  return memoActionsPageResolve(memoKey, () => buildCachedActionsPagePayload(userId, dateKey));
});

// Plan detail page: plan + supplyItems + all tasks (then split incomplete/completed in JS)
const PLAN_TASKS_ORDER = [
  { status: "asc" as const },
  { completedAt: "desc" as const },
  { urgency: "desc" as const },
  { createdAt: "desc" as const },
] as const;

const MAX_COMPLETED_TASKS_ON_PLAN_DETAIL = 200;

const planDetailTaskSelect = {
  id: true,
  title: true,
  content: true,
  dueAt: true,
  recurrence: true,
  urgency: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PlanDetailTaskRow = Prisma.TaskGetPayload<{ select: typeof planDetailTaskSelect }> & {
  attachments: { id: string; url: string; filename: string; size: number }[];
};

type PlanDetailPlanRow = Prisma.PlanGetPayload<{
  include: { supplyItems: true };
}>;

/** Rehydrated plan detail payload for the plan page and consumers that need typed tasks/plan. */
export type CachedPlanDetailBundle = {
  plan: PlanDetailPlanRow | null;
  incompleteTasks: PlanDetailTaskRow[];
  totalIncomplete: number;
  completedTasks: PlanDetailTaskRow[];
  totalCompleted: number;
  exportTasks: PlanDetailTaskRow[];
};

async function fetchPlanDetail(
  planId: string,
  userId: string,
  taskPage: number,
  taskLimit: number,
) {
  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
      OR: [
        { userId },
        { shares: { some: { sharedWithUserId: userId } } },
      ],
    },
    include: {
      tasks: {
        orderBy: [...PLAN_TASKS_ORDER],
        select: planDetailTaskSelect,
      },
      supplyItems: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!plan) {
    return {
      plan: null,
      incompleteTasks: [],
      totalIncomplete: 0,
      completedTasks: [],
      totalCompleted: 0,
      exportTasks: [],
    };
  }

  const emptyAttachments = [] as { id: string; url: string; filename: string; size: number }[];
  const allTasks = plan.tasks.map((t) => ({ ...t, attachments: emptyAttachments }));

  const isCompleted = (t: { status: unknown; completedAt: unknown }) =>
    String(t.status) === "completed" || t.completedAt != null;

  const incomplete = allTasks.filter((t) => !isCompleted(t));
  const completed = allTasks
    .filter((t) => isCompleted(t))
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));

  const { tasks: _, ...planData } = plan;

  return {
    plan: planData,
    incompleteTasks: incomplete.slice((taskPage - 1) * taskLimit, taskPage * taskLimit),
    totalIncomplete: incomplete.length,
    completedTasks: completed.slice(0, MAX_COMPLETED_TASKS_ON_PLAN_DETAIL),
    totalCompleted: completed.length,
    exportTasks: allTasks,
  };
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
    supplyItems: p.supplyItems?.map((s) => rehydrateSupplyItem(s)),
  } as T;
}

async function getCachedPlanDetailData(
  planId: string,
  userId: string,
  taskPage: number,
  taskLimit: number,
): Promise<Awaited<ReturnType<typeof fetchPlanDetail>>> {
  "use cache";
  cacheLife("max");
  cacheTag(getPlanDetailCacheTag(planId));
  const result = await fetchPlanDetail(planId, userId, taskPage, taskLimit);
  return {
    ...result,
    plan: result.plan ? rehydratePlanWithSupplyItems(result.plan) : null,
  } as Awaited<ReturnType<typeof fetchPlanDetail>>;
}

export const getCachedPlanDetail = cache(async (
  planId: string,
  userId: string,
  taskPage: number,
  taskLimit: number,
): Promise<CachedPlanDetailBundle> => {
  const result = await getCachedPlanDetailData(planId, userId, taskPage, taskLimit);
  return {
    plan: result.plan,
    incompleteTasks: result.incompleteTasks.map(rehydrateTask),
    totalIncomplete: result.totalIncomplete,
    completedTasks: result.completedTasks.map(rehydrateTask),
    totalCompleted: result.totalCompleted,
    exportTasks: result.exportTasks.map(rehydrateTask),
  } as CachedPlanDetailBundle;
});

async function fetchPlansForDropdown(userId: string) {
  return prisma.plan.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

async function getCachedPlansForDropdownData(
  userId: string,
): Promise<{ id: string; name: string }[]> {
  "use cache";
  cacheLife("max");
  cacheTag(getPlanListCacheTag(userId));
  return fetchPlansForDropdown(userId);
}

export const getCachedPlansForDropdown = cache((userId: string) => {
  return memoPlanListResolve(userId, () => getCachedPlansForDropdownData(userId));
});

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

function rehydrateSupplyItem<T extends { createdAt?: unknown; updatedAt?: unknown; price?: unknown }>(s: T): T {
  return {
    ...s,
    price: s.price != null ? Number(s.price as number | string) : null,
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

async function getCachedSuppliesPageData(userId: string) {
  "use cache";
  cacheLife("max");
  cacheTag(getSuppliesCacheTag(userId));
  const result = await fetchSuppliesPage(userId);
  return {
    plansWithSupplies: result.plansWithSupplies.map(rehydratePlanWithSupplies),
  };
}

async function buildCachedSuppliesPagePayload(userId: string) {
  return getCachedSuppliesPageData(userId);
}

export const getCachedSuppliesPage = cache((userId: string) => {
  return memoSuppliesPageResolve(userId, () => buildCachedSuppliesPagePayload(userId));
});
