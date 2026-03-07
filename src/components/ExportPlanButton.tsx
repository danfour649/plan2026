"use client";

import type { ExportedPlan } from "@/lib/export";
import { buildPlanExportPayload, downloadExport } from "@/lib/export";

type ExportPlanButtonProps = {
  plan: ExportedPlan;
  label?: string;
  className?: string;
};

export function ExportPlanButton({ plan, label = "Export to JSON", className }: ExportPlanButtonProps) {
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
        "rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
      }
      title="Download this plan and its tasks as JSON for debugging or AI use"
    >
      {label}
    </button>
  );
}
