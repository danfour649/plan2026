import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { getCurrentUserId } from "@/auth";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { DeletePlanButton } from "@/components/DeletePlanButton";
import { EditPlanFormWrapper } from "@/components/EditPlanFormWrapper";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { ExportPlanButton } from "@/components/ExportPlanButton";
import { TaskActionButton } from "@/components/TaskActionButton";
import { InviteByLinkButton } from "@/components/InviteByLinkButton";
import { SharePlanButton } from "@/components/SharePlanButton";
import { TaskContent } from "@/components/TaskContent";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { ExportedPlan, ExportedPlanTask } from "@/lib/export";
import { deletePlan, updatePlan } from "@/lib/actions/plans";
import { addTask, completeTask, deleteTask, restoreTask, updateTask } from "@/lib/actions/tasks";

function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatShortDateOnly(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function formatShortDateTime(d: Date): string {
  return `${formatShortDate(d)} ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function getUrgencyPillClasses(urgency: number) {
  switch (urgency) {
    case 7:
      return "bg-red-100 text-red-700 ring-1 ring-red-200";
    case 6:
      return "bg-orange-100 text-orange-700 ring-1 ring-orange-200";
    case 5:
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case 4:
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case 3:
      return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200";
    case 2:
      return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
    default:
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  }
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);
  const { id } = await params;

  const plan = await prisma.plan.findFirst({
    where: {
      id,
      OR: [
        { userId },
        { shares: { some: { sharedWithUserId: userId } } },
      ],
    },
    include: {
      tasks: {
        orderBy: [
          // PostgreSQL: DESC => NULLS FIRST, so incomplete (null) first, completed at bottom
          { completedAt: "desc" },
          { urgency: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          title: true,
          content: true,
          dueAt: true,
          urgency: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          attachments: {
            select: { id: true, url: true, filename: true, size: true },
          },
        },
      },
    },
  });

  if (!plan) notFound();

  const isOwner = plan.userId === userId;

  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  const userTasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
    select: { id: true, title: true },
  });

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
    taskIds: plan.tasks.map((t) => t.id),
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
    tasks: plan.tasks.map(
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
        <h1 className="truncate text-2xl font-bold tracking-tight text-blue-950">{plan.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isOwner ? t.plans.editPlanDescription : t.plans.viewingSharedPlan}
        </p>
      </div>
      <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <ExportPlanButton plan={planForExport} />
        {isOwner ? (
          <>
            <SharePlanButton planId={plan.id} />
            <InviteByLinkButton planId={plan.id} planName={plan.name} />
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
            planId={plan.id}
            action={updatePlan}
            initialValues={initialValues}
            userTasks={userTasks}
            submitLabel={t.common.savePlan}
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
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-800"
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

        <section className="min-w-0 overflow-x-hidden rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
          <div className="sticky top-0 z-10 border-b border-blue-100 bg-white/90 px-3 py-3 backdrop-blur max-sm:sticky sm:static sm:bg-transparent sm:backdrop-blur-none sm:px-6 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-blue-950">{t.plans.tasksInThisPlan}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {isOwner ? t.plans.editTaskBelowDescription : t.plans.tasksInSharedPlan}
                </p>
              </div>
              {isOwner ? (
                <AddTaskDialog action={addTask} plans={plans} defaultPlanId={plan.id} />
              ) : null}
            </div>
          </div>
          {plan.tasks.length > 0 ? (
            <ul className="divide-y divide-blue-100">
              {plan.tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-3 px-3 py-3 transition hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4"
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
                          <div className="mt-1 flex flex-col gap-0.5 break-words text-xs text-zinc-500 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-0">
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
                      <div className="mt-1 flex flex-col gap-0.5 break-words text-xs text-zinc-500 sm:flex-row sm:flex-wrap sm:gap-x-1 sm:gap-y-0">
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
            </ul>
          ) : (
            <div className="px-3 py-6 text-center sm:px-6 sm:py-8">
              <p className="text-sm text-zinc-500">{t.plans.noTasksInPlan}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {isOwner ? t.plans.addOrLinkTasksDescription : t.plans.planOwnerAddTasks}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
