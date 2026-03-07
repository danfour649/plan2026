"use client";

import type { ExportedTask } from "@/lib/export";
import { buildTaskExportPayload, downloadExport } from "@/lib/export";

type ExportTaskButtonProps = {
  task: ExportedTask;
  label?: string;
  className?: string;
};

export function ExportTaskButton({ task, label = "Export to JSON", className }: ExportTaskButtonProps) {
  function handleClick() {
    const payload = buildTaskExportPayload(task);
    const slug = task.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 20) || "task";
    downloadExport(`plan2026-task-${slug}-${task.id.slice(-6)}.json`, payload);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        "rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
      }
      title="Download this task as JSON for debugging or AI use"
    >
      {label}
    </button>
  );
}
