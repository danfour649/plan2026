"use client";

import { useRouter } from "next/navigation";

import { requestPlanEditBack } from "@/lib/planEditBackNav";

type PlanDetailBackToPlansButtonProps = {
  label: string;
  className?: string;
};

/** Plan owner: above the plan title; shares discard confirmation with EditPlanFormWrapper when dirty. */
export function PlanDetailBackToPlansButton({ label, className }: PlanDetailBackToPlansButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (!requestPlanEditBack()) router.push("/plans");
      }}
      className={
        className ??
        "mb-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
      }
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M12.5 15L7.5 10l5-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
