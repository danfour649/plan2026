"use client";

/** Hex fill color per plan color value (for flag SVG). */
const FLAG_FILL: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  black: "#171717",
  pink: "#ec4899",
  silver: "#94a3b8",
};

type PlanFlagProps = {
  color: string;
  className?: string;
  /** Size in px; default 16. */
  size?: number;
};

/** Renders a small flag icon in the plan color (rectangular flag on pole). */
export function PlanFlag({ color, className, size = 16 }: PlanFlagProps) {
  const fill = FLAG_FILL[color];
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

/** Returns whether the given color has a flag (for conditional rendering). */
export function hasPlanFlag(color: string | null | undefined): boolean {
  return Boolean(color && FLAG_FILL[color]);
}
