import { Printer } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getCurrentUserId } from "@/auth";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { DeletePlanButton } from "@/components/DeletePlanButton";
import { EditPlanFormWrapper } from "@/components/EditPlanFormWrapper";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { ExportPlanButton } from "@/components/ExportPlanButton";
import { PlanSupplyList } from "@/components/PlanSupplyList";
import { TaskActionButton } from "@/components/TaskActionButton";
import { InviteByLinkButton } from "@/components/InviteByLinkButton";
import { ShareByPublicLinkButton } from "@/components/ShareByPublicLinkButton";
import { SharePlanButton } from "@/components/SharePlanButton";
import { TaskContent } from "@/components/TaskContent";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import {
  getCachedPlanDetail,
  getCachedPlansForDropdown,
  getCachedUserTasksForDropdown,
} from "@/lib/data-cache";
import type { ExportedPlan, ExportedPlanTask } from "@/lib/export";
import { deletePlan, updatePlan } from "@/lib/actions/plans";
import { addTask, completeTask, deleteTask, restoreTask, updateTask } from "@/lib/actions/tasks";
import {
  formatShortDate,
  formatShortDateOnly,
  formatShortDateTime,
  getUrgencyPillClasses,
} from "@/lib/format";

const PLAN_TASKS_PAGE_SIZE = 50;
const MAX_PLAN_TASKS_PAGE_SIZE = 100;

function parsePage(value: string | string[] | undefined): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? "1"), 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function parseLimit(value: string | string[] | undefined, defaultSize: number): number {
  const v = Array.isArray(value) ? value[0] : value;
  const n = parseInt(String(v ?? defaultSize), 10);
  if (Number.isNaN(n) || n < 1) return defaultSize;
  return Math.min(n, MAX_PLAN_TASKS_PAGE_SIZE);
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ taskPage?: string | string[]; taskLimit?: string | string[]; tab?: string | string[]; edit?: string | string[] }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const taskPage = parsePage(resolvedSearchParams.taskPage);
  const taskLimit = parseLimit(resolvedSearchParams.taskLimit, PLAN_TASKS_PAGE_SIZE);
  const tabRaw = Array.isArray(resolvedSearchParams.tab) ? resolvedSearchParams.tab[0] : resolvedSearchParams.tab;
  const tab = tabRaw === "list" ? "list" : "tasks";
  const editRaw = Array.isArray(resolvedSearchParams.edit) ? resolvedSearchParams.edit[0] : resolvedSearchParams.edit;
  const editItemId = editRaw && /^[a-z0-9]+$/i.test(editRaw) ? editRaw : undefined;

  const [planDetail, plans, userTasks] = await Promise.all([
    getCachedPlanDetail(id, userId, taskPage, taskLimit),
    getCachedPlansForDropdown(userId),
    getCachedUserTasksForDropdown(userId),
  ]);

  const { plan, planTasks, totalPlanTasks, exportTasks } = planDetail;
  if (!plan) notFound();

  const totalTaskPages = Math.ceil(totalPlanTasks / taskLimit) || 1;
  const isOwner = plan.userId === userId;

  const supplyItemsForClient = plan.supplyItems.map((item) => ({
    id: item.id,
    label: item.label,
    price: item.price != null ? Number(item.price) : null,
    description: item.description ?? null,
    link: item.link ?? null,
    quantity: item.quantity ?? 1,
    acquiredStatus: item.acquiredStatus ?? "needed",
    order: item.order,
  }));

  const initialValues = {
    planId: plan.id,
    name: plan.name,
    description: plan.description ?? undefined,
    goal: plan.goal ?? undefined,
    startAt: plan.startAt,
    endAt: plan.endAt,
    actualStartAt: plan.actualStartAt ?? undefined,
    actualEndAt: plan.actualEndAt ?? undefined,
    status: plan.status,
    priority: plan.priority,
    percentCompleted: plan.percentCompleted,
    notes: plan.notes ?? undefined,
    color: plan.color ?? undefined,
    imageUrl: plan.imageUrl ?? undefined,
    taskIds: exportTasks.map((t) => t.id),
  };

  const planForExport: ExportedPlan = {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    goal: plan.goal,
    startAt: plan.startAt.toISOString(),
    endAt: plan.endAt.toISOString(),
    actualStartAt: plan.actualStartAt?.toISOString() ?? null,
    actualEndAt: plan.actualEndAt?.toISOString() ?? null,
    status: plan.status,
    priority: plan.priority,
    percentCompleted: plan.percentCompleted,
    notes: plan.notes,
    color: plan.color,
    imageUrl: plan.imageUrl,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    tasks: exportTasks.map(
      (taskItem): ExportedPlanTask => ({
        id: taskItem.id,
        title: taskItem.title,
        content: taskItem.content,
        dueAt: taskItem.dueAt?.toISOString() ?? null,
        urgency: taskItem.urgency,
        completedAt: taskItem.completedAt?.toISOString() ?? null,
        createdAt: taskItem.createdAt.toISOString(),
        updatedAt: taskItem.updatedAt.toISOString(),
      }),
    ),
  };

  const titleRow = (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{plan.name}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isOwner ? t.plans.editPlanDescription : t.plans.viewingSharedPlan}
        </p>
      </div>
      <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <ExportPlanButton plan={planForExport} />
        <Link
          href={`/plans/${plan.id}/print`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600 sm:justify-start"
          aria-label={t.plans.printChecklistAria}
        >
          <span className="sm:hidden" aria-hidden>
            <Printer className="size-5" />
          </span>
          <span className="hidden sm:inline">{t.plans.printChecklist}</span>
        </Link>
        {isOwner ? (
          <>
            <SharePlanButton planId={plan.id} />
            <InviteByLinkButton planId={plan.id} planName={plan.name} />
            <ShareByPublicLinkButton planId={plan.id} />
            <DeletePlanButton planId={plan.id} planName={plan.name} action={deletePlan} />
          </>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-w-0 overflow-x-hidden space-y-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
        {isOwner ? (
          <EditPlanFormWrapper
            action={updatePlan}
            initialValues={initialValues}
            userTasks={userTasks}
            submitLabel={t.common.savePlan}
            cancelLabel={t.common.cancel}
            singleColumn={true}
            backLabel={t.common.backToPlans}
            confirmMessage={t.plans.discardEditPlanConfirm}
            discardLeaveLabel={t.plansPage.discardLeave}
            discardStayLabel={t.plansPage.discardStay}
          >
            {titleRow}
          </EditPlanFormWrapper>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            <Link
              href="/plans"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M12.5 15L7.5 10l5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t.common.backToPlans}
            </Link>
            {titleRow}
          </div>
        )}

        <section className="min-w-0 overflow-x-hidden rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
          <div className="sticky top-0 z-10 border-b border-blue-100 bg-white/90 px-3 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/90 max-sm:sticky sm:static sm:bg-transparent sm:backdrop-blur-none sm:dark:bg-transparent sm:px-6 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <nav className="flex gap-1" aria-label={t.plans.tasksInThisPlan}>
                  <Link
                    href={`/plans/${plan.id}${taskPage > 1 || taskLimit !== PLAN_TASKS_PAGE_SIZE ? `?taskPage=${taskPage}&taskLimit=${taskLimit}` : ""}`}
                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                      tab === "tasks"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                        : "text-zinc-600 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-blue-200"
                    }`}
                  >
                    {t.nav.tasks}
                  </Link>
                  <Link
                    href={`/plans/${plan.id}?tab=list`}
                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                      tab === "list"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                        : "text-zinc-600 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-blue-200"
                    }`}
                  >
                    {t.supplyList.tabLabel}
                  </Link>
                </nav>
              </div>
              {tab === "tasks" && isOwner ? (
                <AddTaskDialog action={addTask} plans={plans} defaultPlanId={plan.id} />
              ) : null}
            </div>
            {tab === "tasks" ? (
              <>
                <div className="mt-2">
                  <h2 className="text-lg font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.plans.tasksInThisPlan}</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {isOwner ? t.plans.editTaskBelowDescription : t.plans.tasksInSharedPlan}
                  </p>
                </div>
              </>
            ) : (
              <h2 className="mt-2 text-lg font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.supplyList.title}</h2>
            )}
          </div>
          {tab === "list" ? (
            <div className="px-3 py-4 sm:px-6 sm:py-6">
              <PlanSupplyList planId={plan.id} items={supplyItemsForClient} isOwner={isOwner} initialEditingItemId={editItemId} />
            </div>
          ) : planTasks.length > 0 ? (
            <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
              {planTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-3 px-3 py-3 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4"
                >
                  {isOwner ? (
                    <>
                      <EditTaskDialog
                        action={updateTask}
                        deleteAction={deleteTask}
                        completeAction={completeTask}
                        restoreAction={restoreTask}
                        planId={plan.id}
                        plans={plans}
                        triggerClassName="min-w-0 flex-1 cursor-pointer rounded-xl px-1 py-1 -mx-1 -my-1 text-left"
                        showButton={false}
                        task={{
                          id: task.id,
                          title: task.title,
                          content: task.content,
                          dueAt: task.dueAt?.toISOString() ?? null,
                          urgency: task.urgency,
                          completedAt: task.completedAt?.toISOString() ?? null,
                          planId: plan.id,
                          planName: plan.name,
                          createdAt: task.createdAt.toISOString(),
                          updatedAt: task.updatedAt.toISOString(),
                          attachments: task.attachments.map((a) => ({
                            id: a.id,
                            url: a.url,
                            filename: a.filename,
                            size: a.size,
                          })),
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={`inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ${getUrgencyPillClasses(
                              task.urgency,
                            )}`}
                          >
                            <span className={task.completedAt ? "truncate line-through" : "truncate"}>
                              {task.title}
                            </span>
                          </div>
                          <TaskContent content={task.content} />
                          <div className="mt-1 flex flex-col gap-0.5 break-words text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-0">
                            {task.completedAt ? (
                              <span>{t.tasks.completed} <span className="max-sm:hidden sm:inline">{formatShortDate(new Date(task.completedAt))}</span><span className="max-sm:inline sm:hidden">{formatShortDateOnly(new Date(task.completedAt))}</span></span>
                            ) : (
                              <span>{t.tasks.added} <span className="max-sm:hidden sm:inline">{formatShortDate(task.createdAt)}</span><span className="max-sm:inline sm:hidden">{formatShortDateOnly(task.createdAt)}</span></span>
                            )}
                            {task.dueAt && (
                              <span className="sm:before:content-['·'] sm:before:mr-1">
                                {t.tasks.due}{" "}
                                <span className="max-sm:hidden sm:inline">{formatShortDateTime(new Date(task.dueAt))}</span>
                                <span className="max-sm:inline sm:hidden">{formatShortDateOnly(new Date(task.dueAt))}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </EditTaskDialog>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-shrink-0">
                        <span className="order-1">
                          <TaskActionButton
                            action={task.completedAt ? restoreTask : completeTask}
                            taskId={task.id}
                            planId={plan.id}
                            label={task.completedAt ? t.tasks.restore : t.tasks.markDone}
                            successMessage={task.completedAt ? t.tasks.taskRestored : t.tasks.markedDone}
                          />
                        </span>
                        <span className="order-2">
                        <EditTaskDialog
                          action={updateTask}
                          deleteAction={deleteTask}
                          completeAction={completeTask}
                          restoreAction={restoreTask}
                          planId={plan.id}
                          plans={plans}
                          task={{
                            id: task.id,
                            title: task.title,
                            content: task.content,
                            dueAt: task.dueAt?.toISOString() ?? null,
                            urgency: task.urgency,
                            completedAt: task.completedAt?.toISOString() ?? null,
                            planId: plan.id,
                            planName: plan.name,
                            createdAt: task.createdAt.toISOString(),
                            updatedAt: task.updatedAt.toISOString(),
                            attachments: task.attachments.map((a) => ({
                              id: a.id,
                              url: a.url,
                              filename: a.filename,
                              size: a.size,
                            })),
                          }}
                        />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div
                        className={`inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ${getUrgencyPillClasses(
                          task.urgency,
                        )}`}
                      >
                        <span className={task.completedAt ? "truncate line-through" : "truncate"}>
                          {task.title}
                        </span>
                      </div>
                      <TaskContent content={task.content} />
                      <div className="mt-1 flex flex-col gap-0.5 break-words text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-0">
                        {task.completedAt ? (
                          <span>{t.tasks.completed} <span className="max-sm:hidden sm:inline">{formatShortDate(new Date(task.completedAt))}</span><span className="max-sm:inline sm:hidden">{formatShortDateOnly(new Date(task.completedAt))}</span></span>
                        ) : (
                          <span>{t.tasks.added} <span className="max-sm:hidden sm:inline">{formatShortDate(task.createdAt)}</span><span className="max-sm:inline sm:hidden">{formatShortDateOnly(task.createdAt)}</span></span>
                        )}
                        {task.dueAt && (
                          <span className="sm:before:content-['·'] sm:before:mr-1">
                            {t.tasks.due}{" "}
                            <span className="max-sm:hidden sm:inline">{formatShortDateTime(new Date(task.dueAt))}</span>
                            <span className="max-sm:inline sm:hidden">{formatShortDateOnly(new Date(task.dueAt))}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
              {totalTaskPages > 1 && (
                <li className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 px-3 py-3 dark:border-zinc-700 sm:px-6">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t.common.pageOf.replace("{{current}}", String(taskPage)).replace("{{total}}", String(totalTaskPages))}
                  </span>
                  <div className="flex gap-2">
                    {taskPage > 1 ? (
                      <Link
                        href={`/plans/${plan.id}?taskPage=${taskPage - 1}&taskLimit=${taskLimit}`}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
                      >
                        {t.common.previousPage}
                      </Link>
                    ) : null}
                    {taskPage < totalTaskPages ? (
                      <Link
                        href={`/plans/${plan.id}?taskPage=${taskPage + 1}&taskLimit=${taskLimit}`}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-blue-200 dark:hover:bg-zinc-600"
                      >
                        {t.common.nextPage}
                      </Link>
                    ) : null}
                  </div>
                </li>
              )}
            </ul>
          ) : (
            <div className="px-3 py-6 text-center sm:px-6 sm:py-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.plans.noTasksInPlan}</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {isOwner ? t.plans.addOrLinkTasksDescription : t.plans.planOwnerAddTasks}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
