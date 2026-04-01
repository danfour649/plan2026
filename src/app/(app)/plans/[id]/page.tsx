import { Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUserId } from "@/auth";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { CopyTaskButton } from "@/components/CopyTaskButton";
import { DeletePlanButton } from "@/components/DeletePlanButton";
import { EditPlanFormWrapper } from "@/components/EditPlanFormWrapper";
import { PlanDetailBackToPlansButton } from "@/components/PlanDetailBackToPlansButton";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { ExportPlanButton } from "@/components/ExportPlanButton";
import { PlanDetailTabSection } from "@/components/PlanDetailTabSection";
import { PlanSupplyList } from "@/components/PlanSupplyList";
import { TaskActionButton } from "@/components/TaskActionButton";
import { InviteByLinkButton } from "@/components/InviteByLinkButton";
import { ShareByPublicLinkButton } from "@/components/ShareByPublicLinkButton";
import { SharePlanButton } from "@/components/SharePlanButton";
import { TaskContent } from "@/components/TaskContent";
import { TaskMetadata, type TaskMetadataLabels } from "@/components/TaskMetadata";
import { UrgencyPill } from "@/components/UrgencyPill";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { getCachedPlanDetail, getCachedPlansForDropdown } from "@/lib/data-cache";
import { taskRecurrenceHint } from "@/lib/task-recurrence-ui";
import { planDetailTaskToExportedTask, type ExportedPlan, type ExportedPlanTask } from "@/lib/export";
import { deletePlan, updatePlan } from "@/lib/actions/plans";
import { addTask, completeTask, deleteTask, restoreTask, updateTask } from "@/lib/actions/tasks";

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

function PlanDetailSuspenseFallback() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-6 sm:px-0 sm:py-8">
      <div className="h-9 w-48 rounded-lg bg-blue-100/80 dark:bg-zinc-700" />
      <div className="h-40 rounded-2xl border border-border bg-white/60 dark:bg-zinc-900/60" />
      <div className="h-64 rounded-2xl border border-border bg-white/60 dark:bg-zinc-900/60" />
    </div>
  );
}

type PlanSearchParams = {
  taskPage?: string | string[];
  taskLimit?: string | string[];
  tab?: string | string[];
  edit?: string | string[];
};

async function PlanDetailRoot({
  id,
  searchParams: searchParamsPromise,
}: {
  id: string;
  searchParams: Promise<PlanSearchParams>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const resolvedSearchParams = (await searchParamsPromise) ?? {};
  const taskPage = parsePage(resolvedSearchParams.taskPage);
  const taskLimit = parseLimit(resolvedSearchParams.taskLimit, PLAN_TASKS_PAGE_SIZE);
  const tabRaw = Array.isArray(resolvedSearchParams.tab) ? resolvedSearchParams.tab[0] : resolvedSearchParams.tab;
  const tab = tabRaw === "list" ? "list" : "tasks";
  const editRaw = Array.isArray(resolvedSearchParams.edit) ? resolvedSearchParams.edit[0] : resolvedSearchParams.edit;
  const editItemId = editRaw && /^[a-z0-9]+$/i.test(editRaw) ? editRaw : undefined;

  const [planDetail, plans] = await Promise.all([
    getCachedPlanDetail(id, userId, taskPage, taskLimit),
    getCachedPlansForDropdown(userId),
  ]);

  const { plan, incompleteTasks, totalIncomplete, completedTasks, totalCompleted, exportTasks } = planDetail;
  if (!plan) notFound();

  const totalTaskPages = Math.ceil(totalIncomplete / taskLimit) || 1;
  const hasAnyTasks = incompleteTasks.length > 0 || completedTasks.length > 0;
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
        status: taskItem.status,
        completedAt: taskItem.completedAt?.toISOString() ?? null,
        recurrence: taskItem.recurrence ?? null,
        createdAt: taskItem.createdAt.toISOString(),
        updatedAt: taskItem.updatedAt.toISOString(),
      }),
    ),
  };

  const metaLabels: TaskMetadataLabels = {
    added: t.tasks.added,
    completed: t.tasks.completed,
    due: t.tasks.due,
    planLabel: t.tasks.planLabel,
  };
  const recurrenceLabels = {
    daily: t.tasks.recursDaily,
    weekly: t.tasks.recursWeekly,
    monthly: t.tasks.recursMonthly,
  };

  /** Full-width title/body, then metadata + actions on one row (same at all breakpoints). */
  const ownerPlanTaskRowClass =
    "flex flex-col gap-3 px-3 py-3 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 sm:px-6 sm:py-4";
  const ownerPlanTaskMetaRowClass =
    "flex min-w-0 w-full flex-row items-end justify-between gap-3 sm:gap-4";
  const ownerPlanTaskDialogShellClass = "min-w-0 w-full max-w-full";
  const ownerPlanTaskMetadataClass = "min-w-0 flex-1 !mt-0";
  const ownerPlanTaskActionsClass =
    "flex shrink-0 flex-row flex-wrap items-end justify-end gap-2";

  const titleRow = (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{plan.name}</h1>
        {!isOwner ? <p className="mt-1 text-sm text-muted">{t.plans.viewingSharedPlan}</p> : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
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
    <div className="min-w-0 overflow-x-hidden space-y-6 md:space-y-8">
      <header className="w-full min-w-0">
        {isOwner ? (
          <PlanDetailBackToPlansButton label={t.common.backToPlans} />
        ) : (
          <Link
            href="/plans"
            className="mb-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
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
        )}
        {titleRow}
      </header>

      <div
        className={
          isOwner
            ? "flex min-w-0 flex-col gap-6 md:flex-row md:items-start md:gap-8"
            : "min-w-0"
        }
      >
        {isOwner ? (
          <div className="min-w-0 w-full md:min-w-0 md:flex-1 md:basis-0">
            <EditPlanFormWrapper
              action={updatePlan}
              initialValues={initialValues}
              submitLabel={t.common.savePlan}
              cancelLabel={t.common.cancel}
              singleColumn={true}
              confirmMessage={t.plans.discardEditPlanConfirm}
              discardLeaveLabel={t.plansPage.discardLeave}
              discardStayLabel={t.plansPage.discardStay}
            />
          </div>
        ) : null}

        <div
          className={
            isOwner ? "min-w-0 w-full md:min-w-0 md:flex-1 md:basis-0" : "min-w-0 w-full"
          }
        >
        <PlanDetailTabSection
          planId={plan.id}
          initialTab={tab}
          taskPage={taskPage}
          taskLimit={taskLimit}
          defaultTaskLimit={PLAN_TASKS_PAGE_SIZE}
          navAriaLabel={t.plans.tasksInThisPlan}
          tasksTabLabel={t.nav.tasks}
          suppliesTabLabel={t.supplyList.tabLabel}
          isOwner={isOwner}
          addTaskSlot={<AddTaskDialog action={addTask} plans={plans} defaultPlanId={plan.id} />}
          tasksHeader={
            <div className="mt-2">
              <h2 className="text-lg font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.plans.tasksInThisPlan}</h2>
              <p className="mt-1 text-sm text-muted">
                {isOwner ? t.plans.editTaskBelowDescription : t.plans.tasksInSharedPlan}
              </p>
            </div>
          }
          suppliesHeader={
            <h2 className="mt-2 text-lg font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.supplyList.title}</h2>
          }
          listPanel={
            <div className="px-3 py-4 sm:px-6 sm:py-6">
              <PlanSupplyList planId={plan.id} items={supplyItemsForClient} isOwner={isOwner} initialEditingItemId={editItemId} />
            </div>
          }
          tasksPanel={
            hasAnyTasks ? (
            <>
            <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
              {incompleteTasks.map((task) => (
                <li
                  key={task.id}
                  className={
                    isOwner
                      ? ownerPlanTaskRowClass
                      : "flex flex-row px-3 py-3 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 sm:px-6 sm:py-4"
                  }
                >
                  {isOwner ? (
                    <>
                      <div className={ownerPlanTaskDialogShellClass}>
                        <EditTaskDialog
                          action={updateTask}
                          deleteAction={deleteTask}
                          completeAction={completeTask}
                          restoreAction={restoreTask}
                          planId={plan.id}
                          plans={plans}
                          triggerClassName="min-w-0 min-h-0 w-full max-w-full cursor-pointer rounded-xl px-1 py-1 -mx-1 -my-1 text-left md:block"
                          showButton={false}
                          task={{
                            id: task.id,
                            title: task.title,
                            content: task.content,
                            dueAt: task.dueAt?.toISOString() ?? null,
                            urgency: task.urgency,
                            recurrence: task.recurrence ?? null,
                            status: task.status,
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
                          <div className="min-w-0 w-full max-w-full">
                            <UrgencyPill urgency={task.urgency} title={task.title} completed={task.status === "completed"} status={task.status} onHoldLabel={t.tasks.onHold} />
                            <TaskContent content={task.content} />
                          </div>
                        </EditTaskDialog>
                      </div>
                      <div className={ownerPlanTaskMetaRowClass}>
                        <TaskMetadata
                          isCompleted={task.status === "completed"}
                          createdAt={task.createdAt}
                          completedAt={task.completedAt ? new Date(task.completedAt) : null}
                          dueAt={task.dueAt ? new Date(task.dueAt) : null}
                          recurrenceHint={taskRecurrenceHint(task.recurrence, recurrenceLabels)}
                          labels={metaLabels}
                          stackDueOnDesktop
                          className={ownerPlanTaskMetadataClass}
                        />
                        <div className={ownerPlanTaskActionsClass}>
                          <TaskActionButton
                            compact
                            compactIconsOnly
                            actionVisual={task.status === "completed" ? "restore" : "complete"}
                            action={task.status === "completed" ? restoreTask : completeTask}
                            taskId={task.id}
                            planId={plan.id}
                            label={task.status === "completed" ? t.tasks.restore : t.tasks.markDone}
                            successMessage={task.status === "completed" ? t.tasks.taskRestored : t.tasks.markedDone}
                            recurringSuccessMessage={t.tasks.markedDoneRecurring}
                          />
                          <CopyTaskButton task={planDetailTaskToExportedTask(task, plan.id, plan.name)} />
                          <EditTaskDialog
                            compactListTrigger
                            compactListTriggerIconsOnly
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
                              recurrence: task.recurrence ?? null,
                              status: task.status,
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
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <UrgencyPill urgency={task.urgency} title={task.title} completed={task.status === "completed"} status={task.status} onHoldLabel={t.tasks.onHold} />
                      <TaskContent content={task.content} />
                      <TaskMetadata
                        isCompleted={task.status === "completed"}
                        createdAt={task.createdAt}
                        completedAt={task.completedAt ? new Date(task.completedAt) : null}
                        dueAt={task.dueAt ? new Date(task.dueAt) : null}
                        recurrenceHint={taskRecurrenceHint(task.recurrence, recurrenceLabels)}
                        labels={metaLabels}
                      />
                    </div>
                  )}
                </li>
              ))}
              {totalTaskPages > 1 && (
                <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-3 sm:px-6">
                  <span className="text-sm text-muted">
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
            {completedTasks.length > 0 ? (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className="px-3 text-sm font-semibold text-muted sm:px-6">
                  {t.tasks.completed}
                  {totalCompleted > completedTasks.length
                    ? ` (${completedTasks.length} / ${totalCompleted})`
                    : ` (${completedTasks.length})`}
                </h3>
                <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
                  {completedTasks.map((task) => (
                <li
                  key={task.id}
                  className={
                    isOwner
                      ? ownerPlanTaskRowClass
                      : "flex flex-row px-3 py-3 transition hover:bg-blue-50/40 dark:hover:bg-zinc-800/50 sm:px-6 sm:py-4"
                  }
                >
                  {isOwner ? (
                    <>
                      <div className={ownerPlanTaskDialogShellClass}>
                        <EditTaskDialog
                          action={updateTask}
                          deleteAction={deleteTask}
                          completeAction={completeTask}
                          restoreAction={restoreTask}
                          planId={plan.id}
                          plans={plans}
                          triggerClassName="min-w-0 min-h-0 w-full max-w-full cursor-pointer rounded-xl px-1 py-1 -mx-1 -my-1 text-left md:block"
                          showButton={false}
                          task={{
                            id: task.id,
                            title: task.title,
                            content: task.content,
                            dueAt: task.dueAt?.toISOString() ?? null,
                            urgency: task.urgency,
                            recurrence: task.recurrence ?? null,
                            status: task.status,
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
                          <div className="min-w-0 w-full max-w-full">
                            <UrgencyPill urgency={task.urgency} title={task.title} completed={task.status === "completed"} status={task.status} onHoldLabel={t.tasks.onHold} />
                            <TaskContent content={task.content} />
                          </div>
                        </EditTaskDialog>
                      </div>
                      <div className={ownerPlanTaskMetaRowClass}>
                        <TaskMetadata
                          isCompleted={task.status === "completed"}
                          createdAt={task.createdAt}
                          completedAt={task.completedAt ? new Date(task.completedAt) : null}
                          dueAt={task.dueAt ? new Date(task.dueAt) : null}
                          recurrenceHint={taskRecurrenceHint(task.recurrence, recurrenceLabels)}
                          labels={metaLabels}
                          stackDueOnDesktop
                          className={ownerPlanTaskMetadataClass}
                        />
                        <div className={ownerPlanTaskActionsClass}>
                          <TaskActionButton
                            compact
                            compactIconsOnly
                            actionVisual={task.status === "completed" ? "restore" : "complete"}
                            action={task.status === "completed" ? restoreTask : completeTask}
                            taskId={task.id}
                            planId={plan.id}
                            label={task.status === "completed" ? t.tasks.restore : t.tasks.markDone}
                            successMessage={task.status === "completed" ? t.tasks.taskRestored : t.tasks.markedDone}
                            recurringSuccessMessage={t.tasks.markedDoneRecurring}
                          />
                          <CopyTaskButton task={planDetailTaskToExportedTask(task, plan.id, plan.name)} />
                          <EditTaskDialog
                            compactListTrigger
                            compactListTriggerIconsOnly
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
                              recurrence: task.recurrence ?? null,
                              status: task.status,
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
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <UrgencyPill urgency={task.urgency} title={task.title} completed={task.status === "completed"} status={task.status} onHoldLabel={t.tasks.onHold} />
                      <TaskContent content={task.content} />
                      <TaskMetadata
                        isCompleted={task.status === "completed"}
                        createdAt={task.createdAt}
                        completedAt={task.completedAt ? new Date(task.completedAt) : null}
                        dueAt={task.dueAt ? new Date(task.dueAt) : null}
                        recurrenceHint={taskRecurrenceHint(task.recurrence, recurrenceLabels)}
                        labels={metaLabels}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
              </div>
            ) : null}
            </>
          ) : (
            <div className="px-3 py-6 text-center sm:px-6 sm:py-8">
              <p className="text-sm text-muted">{t.plans.noTasksInPlan}</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {isOwner ? t.plans.addOrLinkTasksDescription : t.plans.planOwnerAddTasks}
              </p>
            </div>
            )}
        />
        </div>
      </div>
    </div>
  );
}

export default function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<PlanSearchParams>;
}) {
  const searchParamsPromise = searchParams ?? Promise.resolve({});
  return (
    <Suspense fallback={<PlanDetailSuspenseFallback />}>
      {params.then(({ id }) => (
        <PlanDetailRoot id={id} searchParams={searchParamsPromise} />
      ))}
    </Suspense>
  );
}
