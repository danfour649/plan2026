import { notFound } from "next/navigation";

import { getCurrentUserId } from "@/auth";
import { DeletePlanButton } from "@/components/DeletePlanButton";
import { PlanForm } from "@/components/PlanForm";
import { prisma } from "@/lib/prisma";
import { deletePlan, updatePlan } from "@/lib/actions/plans";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { id } = await params;

  const plan = await prisma.plan.findFirst({
    where: { id, userId },
    include: { tasks: { select: { id: true } } },
  });

  if (!plan) notFound();

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950">{plan.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Edit plan and tasks. Changes are saved when you submit.
          </p>
        </div>
        <DeletePlanButton planId={plan.id} planName={plan.name} action={deletePlan} />
      </div>

      <section className="rounded-2xl border border-blue-100 bg-white/90 px-6 py-6 shadow-sm shadow-blue-100/40 backdrop-blur">
        <PlanForm
          action={updatePlan}
          initialValues={initialValues}
          userTasks={userTasks}
          isEdit={true}
          submitLabel="Save plan"
        />
      </section>
    </div>
  );
}
