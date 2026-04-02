"use client";

import { DownloadIcon } from "@/components/DownloadIcon";
import { useTranslations } from "@/components/TranslationsProvider";
import type { ExportedPlan } from "@/lib/export";
import { buildPlanExportPayload, downloadExport } from "@/lib/export";

type ExportPlanButtonProps = {
  plan: ExportedPlan;
  className?: string;
};

export function ExportPlanButton({ plan, className }: ExportPlanButtonProps) {
  const t = useTranslations();
  function handleClick() {
    const payload = buildPlanExportPayload(plan);
    const slug = plan.name.replace(/[^a-z0-9]+/gi, "-").slice(0, 30) || "plan";
    downloadExport(`plan2026-plan-${slug}-${plan.id.slice(-6)}.json`, payload);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        "rounded-xl border border-green-200/90 bg-green-50 p-2 text-green-900 transition hover:bg-green-100 dark:border-green-800/70 dark:bg-green-950/50 dark:text-green-100 dark:hover:bg-green-900/55"
      }
      title={t.plans.exportThisPlanToJson}
      aria-label={t.plans.exportThisPlanToJson}
    >
      <DownloadIcon className="h-5 w-5" />
    </button>
  );
}
