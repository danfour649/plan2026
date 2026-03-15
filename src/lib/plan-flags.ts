/** Hex fill color per plan color value (for flag SVG). Shared so server can check valid colors. */
export const PLAN_FLAG_FILL: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  violet: "#8b5cf6",
  black: "#171717",
  pink: "#ec4899",
  silver: "#94a3b8",
};

/** Returns whether the given color has a flag (for conditional rendering). Safe to call on server. */
export function hasPlanFlag(color: string | null | undefined): boolean {
  return Boolean(color && color in PLAN_FLAG_FILL);
}
