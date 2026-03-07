"use client";

import type { ExportedPlan } from "@/lib/export";
import { buildPlansExportPayload, downloadExport } from "@/lib/export";

type ExportPlansButtonProps = {
  plans: ExportedPlan[];
  label?: string;
  className?: string;
};

export function ExportPlansButton({ plans, label = "Export to JSON", className }: ExportPlansButtonProps) {
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
        "rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      }
      title={disabled ? "No plans to export" : "Download plans as JSON for debugging or AI use"}
    >
      {label}
    </button>
  );
}
