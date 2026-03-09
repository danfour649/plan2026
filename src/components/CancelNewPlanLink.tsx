"use client";

import { useRouter } from "next/navigation";

import { clearNewPlanFormDirty, getNewPlanFormDirty } from "@/lib/newPlanDirty";

type CancelNewPlanLinkProps = {
  /** Translated "Cancel new plan" label */
  label: string;
  /** When user has edited and clicks cancel, open the custom confirm dialog (parent renders it). */
  onRequestConfirm: (open: boolean) => void;
};

export function CancelNewPlanLink({ label, onRequestConfirm }: CancelNewPlanLinkProps) {
  const router = useRouter();

  function handleClick() {
    if (getNewPlanFormDirty()) {
      onRequestConfirm(true);
      return;
    }
    clearNewPlanFormDirty();
    router.push("/plans");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex w-fit cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-sm font-medium text-blue-700 transition hover:text-blue-800"
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
