"use client";

import { DownloadIcon } from "@/components/DownloadIcon";
import type { ExportedTask } from "@/lib/export";
import { buildTaskExportPayload, downloadExport } from "@/lib/export";

type ExportTaskButtonProps = {
  task: ExportedTask;
  className?: string;
};

export function ExportTaskButton({ task, className }: ExportTaskButtonProps) {
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
        "rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
      }
      title="Export this task to JSON"
      aria-label="Export this task to JSON"
    >
      <DownloadIcon className="h-5 w-5" />
    </button>
  );
}
