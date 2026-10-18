"use client";

import { AlertTriangle } from "lucide-react";
import { useSyncExternalStore } from "react";

import { isTaskOverdue, readBrowserTimeZone } from "@/lib/task-due";

type TaskOverdueIconProps = {
  dueAt: string | null;
  dueTimeZone?: string | null;
  dueAllDay?: boolean | null;
  label: string;
};

function subscribeToTimeZone(): () => void {
  return () => {};
}

/** Browser zone is unavailable during SSR; the server snapshot stays null so markup matches. */
function serverTimeZone(): null {
  return null;
}

/** Overdue for legacy and all-day dues depends on the viewer's zone, which only the browser knows. */
export function TaskOverdueIcon({ dueAt, dueTimeZone, dueAllDay, label }: TaskOverdueIconProps) {
  const viewerTimeZone = useSyncExternalStore(subscribeToTimeZone, readBrowserTimeZone, serverTimeZone);
  if (!dueAt) return null;
  // Timed dues with a stored zone compare absolute instants, so SSR does not need the browser zone.
  const zoneForCompare = viewerTimeZone ?? (dueTimeZone && !dueAllDay ? dueTimeZone : null);
  if (zoneForCompare == null) return null;

  const overdue = isTaskOverdue(
    { dueAt: new Date(dueAt), dueTimeZone, dueAllDay },
    new Date(),
    zoneForCompare,
  );
  if (!overdue) return null;

  return (
    <span className="shrink-0 text-amber-600 dark:text-amber-400" title={label} aria-label={label}>
      <AlertTriangle className="h-5 w-5" />
    </span>
  );
}
