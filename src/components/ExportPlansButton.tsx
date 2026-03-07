"use client";

import { DownloadIcon } from "@/components/DownloadIcon";
import { useTranslations } from "@/components/TranslationsProvider";
import type { ExportedPlan } from "@/lib/export";
import { buildPlansExportPayload, downloadExport } from "@/lib/export";

type ExportPlansButtonProps = {
  plans: ExportedPlan[];
  className?: string;
};

export function ExportPlansButton({ plans, className }: ExportPlansButtonProps) {
  const t = useTranslations();
  const disabled = plans.length === 0;

  function handleClick() {
    const payload = buildPlansExportPayload(plans);
    const date = new Date().toISOString().slice(0, 10);
    downloadExport(`plan2026-plans-${date}.json`, payload);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={
        className ??
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-0 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      }
      title={disabled ? t.plans.noPlansToExport : t.plans.exportPlansToJson}
      aria-label={disabled ? t.plans.noPlansToExport : t.plans.exportPlansToJson}
    >
      <DownloadIcon className="h-5 w-5" />
    </button>
  );
}
