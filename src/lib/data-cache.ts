/**
 * Server-side data cache using Next.js Cache Components (`use cache`) + cacheTag +
 * revalidateTag. Cached data is reused when navigating between pages; mutations call
 * revalidateTag() so the next request gets fresh data.
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
import type { Prisma } from "@prisma/client";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
async function fetchNavCounts(userId: string): Promise<NavCounts> {
  const row = await prisma.$queryRaw<
    [{ remaining_task_count: bigint; active_plan_count: bigint; supplies_count: bigint }]
  >`
    SELECT
      (SELECT COUNT(*)::int FROM "Task" WHERE "userId" = ${userId} AND "status" <> 'completed') AS "remaining_task_count",
      (SELECT COUNT(*)::int FROM "Plan" WHERE "userId" = ${userId} AND "status" NOT IN ('completed', 'abandoned')) AS "active_plan_count",
      (SELECT COUNT(*)::int FROM "SupplyItem" s
       INNER JOIN "Plan" p ON p.id = s."planId"
       WHERE p."userId" = ${userId}
          OR EXISTS (SELECT 1 FROM "PlanShare" ps WHERE ps."planId" = p.id AND ps."sharedWithUserId" = ${userId})) AS "supplies_count"
  `;
  const r = row[0];
  return {
    remainingTaskCount: Number(r?.remaining_task_count ?? 0),
    activePlanCount: Number(r?.active_plan_count ?? 0),
    suppliesCount: Number(r?.supplies_count ?? 0),
  };
}

async function getCachedNavCountsData(userId: string): Promise<NavCounts> {
  "use cache";
  cacheLife("max");
  cacheTag(navCountsTag(userId));
  return fetchNavCounts(userId);
}

export const getCachedNavCounts = cache((userId: string): Promise<NavCounts> => {
  return getCachedNavCountsData(userId);
});

// Plans list: used by /plans page — Prisma loads plans + nested task rows (id, status, completedAt) in one findMany;
// total count uses the same filter in parallel (same round-trip pattern as before, without SQL json_agg).
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
  tasks: {
    select: {
      id: true,
      status: true,
      completedAt: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.PlanSelect;

async function fetchPlansPage(
  userId: string,
  showArchived: boolean,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const where: Prisma.PlanWhereInput = {
    OR: [{ userId }, { shares: { some: { sharedWithUserId: userId } } }],
    ...(!showArchived ? { status: { notIn: ["completed", "abandoned"] } } : {}),
  };

  const [planRows, totalPlans] = await Promise.all([
    prisma.plan.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      select: plansPageListSelect,
    }),
    prisma.plan.count({ where }),
  ]);

  const plans = planRows.map((p) => ({
    ...p,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      status: t.status,
      completedAt: t.completedAt,
    })),
  }));

  return { plans, totalPlans };
}

function rehydratePlan<T extends { startAt: unknown; endAt: unknown; actualStartAt?: unknown; actualEndAt?: unknown; createdAt: unknown; updatedAt: unknown; tasks?: Array<{ id: unknown; status: unknown; completedAt?: unknown }>; completedTaskCount?: number }>(
  p: T,
): T & { completedTaskCount: number } {
  const tasks = p.tasks?.map((t) => ({ ...t, completedAt: t.completedAt != null ? toDate(t.completedAt) : null }));
  const completedTaskCount =
    p.completedTaskCount ??
    (tasks?.filter((t) => {
      const status = String((t as { status?: unknown }).status ?? "");
      const hasCompletedAt = (t as { completedAt?: unknown }).completedAt != null;
      return status === "completed" || hasCompletedAt;
    }).length ?? 0);
  return {
    ...p,
    startAt: toDate(p.startAt),
    endAt: toDate(p.endAt),
    actualStartAt: p.actualStartAt != null ? toDate(p.actualStartAt) : null,
    actualEndAt: p.actualEndAt != null ? toDate(p.actualEndAt) : null,
    createdAt: toDate(p.createdAt),
    updatedAt: toDate(p.updatedAt),
    tasks,
    completedTaskCount,
  } as T & { completedTaskCount: number };
}

async function getCachedPlansPageData(
  userId: string,
  showArchived: boolean,
  page: number,
  limit: number,
) {
  "use cache";
  cacheLife("max");
  cacheTag(getPlansCacheTag(userId));
  return fetchPlansPage(userId, showArchived, page, limit);
}

export async function getCachedPlansPage(
  userId: string,
  showArchived: boolean,
  page: number,
  limit: number,
) {
  const result = await getCachedPlansPageData(userId, showArchived, page, limit);
  return { plans: result.plans.map(rehydratePlan), totalPlans: result.totalPlans };
}

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

async function fetchTasksPage(
  userId: string,
  showCompleted: boolean,
  page: number,
  limit: number,
  completedPage: number,
  knownTotalRemaining?: number,
) {
  const remainingWhere = { userId, status: { not: TaskStatus.completed } };
  const [remainingRows, totalRemaining] = await Promise.all([
    prisma.task.findMany({
      where: remainingWhere,
      orderBy: [{ status: "asc" }, { urgency: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: taskInclude,
    }),
    knownTotalRemaining !== undefined
      ? Promise.resolve(knownTotalRemaining)
      : getCachedNavCounts(userId).then((n) => n.remainingTaskCount),
  ]);
  const remainingTasks = remainingRows.map((t) => ({ ...t, attachments: [] as { id: string; url: string; filename: string; size: number }[] }));

  const completedWhere = { userId, status: TaskStatus.completed };
  const [completedRows, totalCompleted] = showCompleted
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
  const completedTasks = (completedRows as typeof remainingRows).map((t) => ({ ...t, attachments: [] as { id: string; url: string; filename: string; size: number }[] }));

  return {
    remainingTasks,
    totalRemaining,
    completedTasks,
    totalCompleted,
  };
}

async function getCachedTasksPageData(
  userId: string,
  showCompleted: boolean,
  page: number,
  limit: number,
  completedPage: number,
  knownTotalRemaining?: number,
) {
  "use cache";
  cacheLife("max");
  cacheTag(getTasksCacheTag(userId));
  return fetchTasksPage(userId, showCompleted, page, limit, completedPage, knownTotalRemaining);
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
  /** When provided (e.g. from getCachedNavCounts), avoids an extra remaining-task count query. */
  knownTotalRemaining?: number,
): Promise<{
  remainingTasks: CachedTasksPageTask[];
  totalRemaining: number;
  completedTasks: CachedTasksPageTask[];
  totalCompleted: number;
  plans: { id: string; name: string }[];
}> {
  const result = await getCachedTasksPageData(
    userId,
    showCompleted,
    page,
    limit,
    completedPage,
    knownTotalRemaining,
  );
  const plans = await getCachedPlansForDropdown(userId);
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
  const withAttachments = tasks.map((t) => ({ ...t, attachments: [] as { id: string; url: string; filename: string; size: number }[] }));
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

export async function getCachedActionsPage(userId: string): Promise<{
  tasks: CachedTasksPageTask[];
  plans: { id: string; name: string }[];
}> {
  const { startOfToday } = getActionsDateRange();
  const dateKey = startOfToday.toISOString().slice(0, 10);
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

function isTaskCompleted(task: { status: unknown; completedAt: unknown }): boolean {
  const status = String(task.status ?? "");
  const hasCompletedAt = task.completedAt != null && task.completedAt !== undefined;
  return status === "completed" || hasCompletedAt;
}

async function fetchPlanDetail(
  planId: string,
  userId: string,
  taskPage: number,
  taskLimit: number,
) {
  // Attachments are not loaded here; edit dialog fetches them when opened.
  const [plan, allTasksRows] = await Promise.all([
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
      select: planDetailTaskSelect,
    }),
  ]);
  const allTasks = allTasksRows.map((t) => ({ ...t, attachments: [] as { id: string; url: string; filename: string; size: number }[] }));

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

  const incompleteTasks = allTasks.filter((t) => !isTaskCompleted(t));
  const completedTasks = [...allTasks.filter((t) => isTaskCompleted(t))].sort(
    (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
  );

  const totalIncomplete = incompleteTasks.length;
  const totalCompleted = completedTasks.length;

  const incompletePaginated = incompleteTasks.slice(
    (taskPage - 1) * taskLimit,
    taskPage * taskLimit,
  );

  const completedToShow = completedTasks.slice(0, MAX_COMPLETED_TASKS_ON_PLAN_DETAIL);

  const exportTasks = allTasks;

  return {
    plan,
    incompleteTasks: incompletePaginated,
    totalIncomplete,
    completedTasks: completedToShow,
    totalCompleted,
    exportTasks,
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

export async function getCachedPlanDetail(
  planId: string,
  userId: string,
  taskPage: number,
  taskLimit: number,
): Promise<CachedPlanDetailBundle> {
  const result = await getCachedPlanDetailData(planId, userId, taskPage, taskLimit);
  return {
    plan: result.plan,
    incompleteTasks: result.incompleteTasks.map(rehydrateTask),
    totalIncomplete: result.totalIncomplete,
    completedTasks: result.completedTasks.map(rehydrateTask),
    totalCompleted: result.totalCompleted,
    exportTasks: result.exportTasks.map(rehydrateTask),
  } as CachedPlanDetailBundle;
}

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

export async function getCachedPlansForDropdown(userId: string) {
  return getCachedPlansForDropdownData(userId);
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

export async function getCachedSuppliesPage(userId: string) {
  return getCachedSuppliesPageData(userId);
}
