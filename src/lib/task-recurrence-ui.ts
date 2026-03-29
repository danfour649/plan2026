/** Localized short label for list metadata (e.g. "Repeats daily"). */
export function taskRecurrenceHint(
  recurrence: "daily" | "weekly" | "monthly" | null | undefined,
  labels: { daily: string; weekly: string; monthly: string },
): string | null {
  if (recurrence === "daily") return labels.daily;
  if (recurrence === "weekly") return labels.weekly;
  if (recurrence === "monthly") return labels.monthly;
  return null;
}
