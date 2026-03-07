"use client";

import type { ExportedTask } from "@/lib/export";
import { buildTasksExportPayload, downloadExport } from "@/lib/export";

type ExportTasksButtonProps = {
  tasks: ExportedTask[];
  label?: string;
  className?: string;
};

export function ExportTasksButton({ tasks, label = "Export to JSON", className }: ExportTasksButtonProps) {
  const disabled = tasks.length === 0;

  function handleClick() {
    const payload = buildTasksExportPayload(tasks);
    const date = new Date().toISOString().slice(0, 10);
    downloadExport(`plan2026-tasks-${date}.json`, payload);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={
        className ??
        "rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      }
      title={disabled ? "No tasks to export" : "Download tasks as JSON for debugging or AI use"}
    >
      {label}
    </button>
  );
}
