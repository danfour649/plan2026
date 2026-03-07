"use client";

import { DownloadIcon } from "@/components/DownloadIcon";
import { useTranslations } from "@/components/TranslationsProvider";
import type { ExportedTask } from "@/lib/export";
import { buildTasksExportPayload, downloadExport } from "@/lib/export";

type ExportTasksButtonProps = {
  tasks: ExportedTask[];
  className?: string;
};

export function ExportTasksButton({ tasks, className }: ExportTasksButtonProps) {
  const t = useTranslations();
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
        "rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      }
      title={disabled ? t.calendar.noTasksToExport : t.calendar.exportTasksToJson}
      aria-label={disabled ? t.calendar.noTasksToExport : t.calendar.exportTasksToJson}
    >
      <DownloadIcon className="h-5 w-5" />
    </button>
  );
}
