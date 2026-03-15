"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { ExportTaskButton } from "@/components/ExportTaskButton";
import { TaskForm } from "@/components/TaskForm";
import { useTranslations } from "@/components/TranslationsProvider";
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
    planName?: string | null;
    createdAt?: string;
    updatedAt?: string;
    attachments?: { id: string; url: string; filename: string; size: number }[];
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
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [attachments, setAttachments] = useState(task.attachments ?? []);
  const [uploading, setUploading] = useState(false);
  const isCompleted = Boolean(task.completedAt);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    if (isOpen) setAttachments(task.attachments ?? []);
  }, [isOpen, task.attachments]);
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

  // Reset overlay scroll so the dialog form is in view when opened (does not move page scroll).
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        overlayRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!deleteState) return;

    if (deleteState.success) {
      toast.success(t.tasks.taskDeleted);
      queueMicrotask(() => {
        if (isMountedRef.current) setIsOpen(false);
      });
    } else if (deleteState.error) {
      toast.error(deleteState.error);
    }
  }, [deleteState, t.tasks.taskDeleted]);

  useEffect(() => {
    if (!doneRestoreState || !doneRestoreAction) return;

    if (doneRestoreState.success) {
      // Show message for the action we just ran (complete vs restore), not the resulting state
      toast.success(doneRestoreAction === completeAction ? t.tasks.markedDone : t.tasks.taskRestored);
      queueMicrotask(() => {
        if (isMountedRef.current) setIsOpen(false);
      });
    } else if (doneRestoreState.error) {
      toast.error(doneRestoreState.error);
    }
  }, [doneRestoreState, doneRestoreAction, completeAction, t.tasks.markedDone, t.tasks.taskRestored]);

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
          {t.common.edit}
        </button>
      ) : null}

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-zinc-950/45 px-4 pt-6 pb-8 sm:pt-8"
            onClick={() => setIsOpen(false)}
            role="presentation"
          >
            <div
              className="w-full max-w-2xl shrink-0 rounded-3xl border border-blue-100 bg-white px-6 pb-6 pt-4 shadow-2xl shadow-blue-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-950/50"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`edit-task-dialog-title-${task.id}`}
            >
            <div className="mb-1 flex items-start justify-between gap-4">
              <div>
                <h2
                  id={`edit-task-dialog-title-${task.id}`}
                  className="text-xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100"
                >
                  {t.tasks.editTask}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                aria-label={t.common.closeEditTaskDialog}
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
              submitLabel={t.common.saveChanges}
              successMessage={t.tasks.taskUpdated}
              initialValues={{
                taskId: task.id,
                title: task.title,
                content: task.content ?? undefined,
                dueAt: task.dueAt,
                urgency: task.urgency,
                planId: task.planId ?? undefined,
              }}
              plans={plans}
              formId={`edit-task-form-${task.id}`}
              hideSubmit
            />

            <div className="mt-4 border-t border-blue-100 pt-4 dark:border-zinc-700">
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{t.common.attachments}</p>
              {attachments.length > 0 ? (
                <ul className="mb-2 space-y-1">
                  {attachments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                      <a
                        href={`/api/tasks/${task.id}/attachments/${a.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {a.filename}
                      </a>
                      <span className="shrink-0 text-zinc-400 dark:text-zinc-500">
                        ({(a.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/tasks/${task.id}/attachments/${a.id}`, {
                            method: "DELETE",
                          });
                          if (res.ok) setAttachments((prev) => prev.filter((x) => x.id !== a.id));
                          else toast.error(t.tasks.failedToRemoveAttachment);
                        }}
                        className="shrink-0 rounded px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        aria-label={`${t.common.remove} ${a.filename}`}
                      >
                        {t.common.remove}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                <input
                  type="file"
                  className="sr-only"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const maxSize = 5 * 1024 * 1024; // 5 MB
                    if (file.size > maxSize) {
                      toast.error(t.tasks.fileTooLarge);
                      e.target.value = "";
                      return;
                    }
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.set("file", file);
                      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
                        method: "POST",
                        body: fd,
                      });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok && data.id) {
                        setAttachments((prev) => [
                          ...prev,
                          {
                            id: data.id,
                            url: data.url,
                            filename: data.filename,
                            size: data.size,
                          },
                        ]);
                        toast.success(t.tasks.fileAttached);
                      } else {
                        toast.error(data.error ?? t.tasks.uploadFailed);
                      }
                    } finally {
                      setUploading(false);
                      e.target.value = "";
                    }
                  }}
                />
                {uploading ? t.tasks.uploading : t.tasks.addFile}
              </label>
            </div>

            <div className="mt-6 border-t border-blue-100 pt-4 dark:border-zinc-700">
              <div className="flex flex-wrap items-center gap-3">
                <ExportTaskButton
                  task={{
                    id: task.id,
                    title: task.title,
                    content: task.content,
                    dueAt: task.dueAt,
                    urgency: task.urgency,
                    completedAt: task.completedAt ?? null,
                    planId: task.planId ?? null,
                    planName: task.planName ?? null,
                    createdAt: task.createdAt ?? new Date().toISOString(),
                    updatedAt: task.updatedAt ?? new Date().toISOString(),
                  }}
                />
                {completeAction && restoreAction ? (
                  <form action={doneRestoreFormAction} className="flex items-center gap-3">
                    <input type="hidden" name="taskId" value={task.id} />
                    {planId ? <input type="hidden" name="planId" value={planId} /> : null}
                    <button
                      type="submit"
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-blue-200 dark:hover:bg-zinc-700"
                    >
                      {isCompleted ? t.tasks.restore : t.tasks.markDone}
                    </button>
                  </form>
                ) : null}
                <form action={deleteFormAction} className="flex items-center gap-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  {task.planId ? <input type="hidden" name="planId" value={task.planId} /> : null}
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50"
                    >
                      {t.tasks.deleteTask}
                    </button>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {t.tasks.deleteTaskConfirm}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl border border-red-200 bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 dark:border-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        {t.tasks.deleteTask}
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>

            <div className="mt-6 border-t border-blue-100 pt-4 dark:border-zinc-700">
              <button
                type="submit"
                form={`edit-task-form-${task.id}`}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-blue-300/60 transition hover:bg-blue-700 dark:bg-blue-500 dark:shadow-zinc-950/40 dark:hover:bg-blue-600 sm:w-auto"
              >
                {t.common.saveChanges}
              </button>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
