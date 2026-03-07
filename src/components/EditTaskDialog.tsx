"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { TaskForm } from "@/components/TaskForm";
import type { ActionResult } from "@/lib/actions/tasks";

type EditTaskAction = (formData: FormData) => Promise<ActionResult>;
type DeleteTaskAction = (formData: FormData) => Promise<ActionResult>;
type CompleteOrRestoreAction = (formData: FormData) => Promise<ActionResult>;

function wrap(
  fn: DeleteTaskAction | CompleteOrRestoreAction,
): (prev: ActionResult | null, formData: FormData) => Promise<ActionResult> {
  return (_prev, formData) => fn(formData);
}

type EditTaskDialogProps = {
  action: EditTaskAction;
  deleteAction: DeleteTaskAction;
  task: {
    id: string;
    title: string;
    content: string | null;
    dueAt: string | null;
    urgency: number;
    completedAt?: string | null;
    planId?: string | null;
  };
  children?: React.ReactNode;
  triggerClassName?: string;
  showButton?: boolean;
  /** When set, show "Mark done" (or "Restore" if task is completed) in the dialog. Pass planId to revalidate the plan page after. */
  completeAction?: CompleteOrRestoreAction;
  restoreAction?: CompleteOrRestoreAction;
  planId?: string;
  /** When provided, show plan selector in the edit form. */
  plans?: { id: string; name: string }[];
};

function isInteractiveTarget(target: EventTarget | null, currentTarget: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  const interactiveAncestor = target.closest(
    "a, button, input, textarea, select, label, [role='button']",
  );

  return interactiveAncestor !== null && interactiveAncestor !== currentTarget;
}

export function EditTaskDialog({
  action,
  deleteAction,
  task,
  children,
  triggerClassName,
  showButton = true,
  completeAction,
  restoreAction,
  planId,
  plans,
}: EditTaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isCompleted = Boolean(task.completedAt);
  const doneRestoreAction = isCompleted ? restoreAction : completeAction;
  const [deleteState, deleteFormAction] = useActionState(
    wrap(deleteAction),
    null as ActionResult | null,
  );
  const [doneRestoreState, doneRestoreFormAction] = useActionState(
    wrap(doneRestoreAction ?? (() => Promise.resolve({ success: false, error: "" }))),
    null as ActionResult | null,
  );

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!deleteState) return;

    if (deleteState.success) {
      toast.success("Task deleted");
      queueMicrotask(() => setIsOpen(false));
    } else if (deleteState.error) {
      toast.error(deleteState.error);
    }
  }, [deleteState]);

  useEffect(() => {
    if (!doneRestoreState || !doneRestoreAction) return;

    if (doneRestoreState.success) {
      toast.success(isCompleted ? "Task restored" : "Marked done");
      queueMicrotask(() => setIsOpen(false));
    } else if (doneRestoreState.error) {
      toast.error(doneRestoreState.error);
    }
  }, [doneRestoreState, doneRestoreAction, isCompleted]);

  return (
    <>
      {children ? (
        <div
          role="button"
          tabIndex={0}
          onClick={(event) => {
            if (!isInteractiveTarget(event.target, event.currentTarget)) setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          className={triggerClassName}
        >
          {children}
        </div>
      ) : null}

      {showButton ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
        >
          Edit
        </button>
      ) : null}

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 px-4 py-8"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-blue-100 bg-white px-6 pb-6 pt-4 shadow-2xl shadow-blue-950/10"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-task-dialog-title-${task.id}`}
          >
            <div className="mb-1 flex items-start justify-between gap-4">
              <div>
                <h2
                  id={`edit-task-dialog-title-${task.id}`}
                  className="text-xl font-semibold tracking-tight text-blue-950"
                >
                  Edit task
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                aria-label="Close edit task dialog"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M5 5L15 15M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <TaskForm
              action={action}
              onSuccess={() => setIsOpen(false)}
              submitLabel="Save changes"
              successMessage="Task updated"
              initialValues={{
                taskId: task.id,
                title: task.title,
                content: task.content ?? undefined,
                dueAt: task.dueAt,
                urgency: task.urgency,
                planId: task.planId ?? undefined,
              }}
              plans={plans}
            />

            {completeAction && restoreAction ? (
              <div className="mt-6 border-t border-blue-100 pt-4">
                <form action={doneRestoreFormAction} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  {planId ? <input type="hidden" name="planId" value={planId} /> : null}
                  <p className="text-sm text-zinc-500">
                    {isCompleted ? "Reopen this task so it appears in your remaining list." : "Mark this task as done."}
                  </p>
                  <button
                    type="submit"
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    {isCompleted ? "Restore" : "Mark done"}
                  </button>
                </form>
              </div>
            ) : null}

            <div className="mt-6 border-t border-blue-100 pt-4">
              <form action={deleteFormAction} className="flex flex-col gap-3">
                <input type="hidden" name="taskId" value={task.id} />
                {!showDeleteConfirm ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-500">Remove this task permanently.</p>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                      Delete task
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-zinc-600">
                      Are you sure you want to delete this task? This cannot be undone.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        Delete task
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
