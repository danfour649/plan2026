import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";
import {
  ExportPlansButtonFiltered,
  PlansShowArchivedRoot,
  PlansShowArchivedToggle,
} from "@/components/PlansShowArchivedRoot";
import { PlansListSection } from "@/components/PlansListSection";
import { RefreshPlansButton } from "@/components/RefreshPlansButton";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { getCachedPlansPage } from "@/lib/data-cache";
import type { ExportedPlan } from "@/lib/export";
import {
  PLANS_SHOW_ARCHIVED_COOKIE,
  readPlansShowArchivedFromCookie,
} from "@/lib/list-filter-preferences";

function plansShowArchivedFromSearchParams(
  raw: string | string[] | undefined,
): boolean | null {
  if (raw === undefined) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined || v === "") return null;
  if (v === "1") return true;
  if (v === "0") return false;
  return null;
}

const DEFAULT_PLANS_PAGE_SIZE = 20;
const MAX_PLANS_PAGE_SIZE = 100;

function parsePage(value: string | string[] | undefined): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? "1"), 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function parseLimit(value: string | string[] | undefined, defaultSize: number): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? defaultSize), 10);
  if (Number.isNaN(n) || n < 1) return defaultSize;
  return Math.min(n, MAX_PLANS_PAGE_SIZE);
}

function mapPlansToExport(
  plans: Awaited<ReturnType<typeof getCachedPlansPage>>["activePlans"],
): ExportedPlan[] {
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    goal: p.goal,
    startAt: p.startAt.toISOString(),
    endAt: p.endAt.toISOString(),
    actualStartAt: p.actualStartAt?.toISOString() ?? null,
    actualEndAt: p.actualEndAt?.toISOString() ?? null,
    status: p.status,
    priority: p.priority,
    percentCompleted: p.percentCompleted,
    notes: p.notes,
    color: p.color,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    taskSummaries: p.tasks.map((task) => ({
      id: task.id,
      status: task.status,
    })),
  }));
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams?: Promise<{
    showArchived?: string | string[];
    page?: string | string[];
    limit?: string | string[];
  }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const fromUrl = plansShowArchivedFromSearchParams(resolvedSearchParams.showArchived);
  const cookieStore = await cookies();
  const fromCookie = readPlansShowArchivedFromCookie(
    cookieStore.get(PLANS_SHOW_ARCHIVED_COOKIE)?.value,
  );
  const showArchived = fromUrl !== null ? fromUrl : fromCookie;
  const page = parsePage(resolvedSearchParams.page);
  const limit = parseLimit(resolvedSearchParams.limit, DEFAULT_PLANS_PAGE_SIZE);

  const { activePlans, totalActive, allPlans, totalAll } = await getCachedPlansPage(userId, page, limit);
  const totalPagesActive = Math.ceil(totalActive / limit) || 1;
  const totalPagesAll = Math.ceil(totalAll / limit) || 1;

  const exportActive = mapPlansToExport(activePlans);
  const exportFull = mapPlansToExport(allPlans);

  const header = (
    <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-6 py-4 dark:border-zinc-700 sm:gap-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.plansPage.title}</h2>
        <div className="flex shrink-0 items-center gap-1">
          <RefreshPlansButton />
          <ExportPlansButtonFiltered
            activePlans={exportActive}
            fullPlans={exportFull}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-0 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          />
        </div>
      </div>
      <div className="ml-auto flex flex-nowrap items-center gap-2 sm:gap-4">
        <PlansShowArchivedToggle />
        <Link
          href="/plans/new"
          prefetch={false}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 sm:h-auto sm:w-fit sm:px-4 sm:py-2"
          aria-label={t.plans.addPlanAria}
        >
          <span className="text-xl font-medium sm:hidden" aria-hidden>
            +
          </span>
          <span className="hidden text-sm font-medium sm:inline">{t.plansPage.addPlan}</span>
        </Link>
      </div>
    </div>
  );

  const activeSlot = (
    <PlansListSection
      plans={activePlans}
      userId={userId}
      t={t}
      page={page}
      limit={limit}
      totalPages={totalPagesActive}
    />
  );

  const fullSlot = (
    <PlansListSection
      plans={allPlans}
      userId={userId}
      t={t}
      page={page}
      limit={limit}
      totalPages={totalPagesAll}
    />
  );

  return (
    <div className="space-y-8">
      <PlansShowArchivedRoot
        initialShowArchived={showArchived}
        header={header}
        activeSlot={activeSlot}
        fullSlot={fullSlot}
      />
    </div>
  );
}
