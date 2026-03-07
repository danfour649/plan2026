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
        "rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-700 transition hover:bg-blue-100"
      }
      title={t.plans.exportThisPlanToJson}
      aria-label={t.plans.exportThisPlanToJson}
    >
      <DownloadIcon className="h-5 w-5" />
    </button>
  );
}
