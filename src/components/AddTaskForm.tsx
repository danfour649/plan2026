"use client";

import { TaskForm } from "@/components/TaskForm";
import type { ActionResult } from "@/lib/actions/tasks";

type AddTaskAction = (formData: FormData) => Promise<ActionResult>;

export function AddTaskForm({
  action,
  onSuccess,
}: {
  action: AddTaskAction;
  onSuccess?: () => void;
}) {
  return <TaskForm action={action} onSuccess={onSuccess} submitLabel="Add task" successMessage="Task added" />;
}
