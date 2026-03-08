"use client";

import { TaskForm } from "@/components/TaskForm";
import { useTranslations } from "@/components/TranslationsProvider";
import type { ActionResult } from "@/lib/actions/tasks";

type AddTaskAction = (formData: FormData) => Promise<ActionResult>;

export function AddTaskForm({
  action,
  onSuccess,
  plans,
  defaultPlanId,
}: {
  action: AddTaskAction;
  onSuccess?: () => void;
  plans?: { id: string; name: string }[];
  /** Pre-select this plan when adding a task (e.g. from a plan detail page). */
  defaultPlanId?: string;
}) {
  const t = useTranslations();
  return (
    <TaskForm
      action={action}
      onSuccess={onSuccess}
      submitLabel={t.common.addTask}
      successMessage={t.tasks.taskAdded}
      plans={plans}
      initialValues={defaultPlanId ? { planId: defaultPlanId } : undefined}
    />
  );
}
