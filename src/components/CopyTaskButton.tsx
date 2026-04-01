"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { useTranslations } from "@/components/TranslationsProvider";
import { buildTaskExportPayload, type ExportedTask } from "@/lib/export";

const defaultClassName =
  "hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300 bg-violet-100 p-0 text-violet-800 transition hover:bg-violet-200 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-800/50";

type CopyTaskButtonProps = {
  task: ExportedTask;
  className?: string;
};

export function CopyTaskButton({ task, className }: CopyTaskButtonProps) {
  const t = useTranslations();

  async function handleClick() {
    const text = JSON.stringify(buildTaskExportPayload(task), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.toasts.taskCopiedToClipboard);
    } catch {
      toast.error(t.toasts.failedToCopy);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className ?? defaultClassName}
      title={t.tasks.copyTaskDetails}
      aria-label={t.tasks.copyTaskDetails}
    >
      <Copy className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
