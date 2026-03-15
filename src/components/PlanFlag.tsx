"use client";

import { PLAN_FLAG_FILL } from "@/lib/plan-flags";

type PlanFlagProps = {
  color: string;
  className?: string;
  /** Size in px; default 16. */
  size?: number;
};

/** Renders a small flag icon in the plan color (rectangular flag on pole). */
export function PlanFlag({ color, className, size = 16 }: PlanFlagProps) {
  const fill = PLAN_FLAG_FILL[color];
  if (!fill) return null;

  return (
    <span
      className={`inline-block shrink-0 leading-none ${className ?? ""}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pole */}
        <rect x="3" y="2" width="2" height="20" fill="#78716c" rx="1" />
        {/* Flag (rectangle) */}
        <rect x="5" y="4" width="14" height="6" rx="0.5" fill={fill} />
      </svg>
    </span>
  );
}

export { hasPlanFlag } from "@/lib/plan-flags";
