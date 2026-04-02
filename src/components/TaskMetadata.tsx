"use client";

import Link from "next/link";

import { useAppLocale } from "@/components/TranslationsProvider";
import { formatShortDate, formatShortDateOnly, formatShortDateTime } from "@/lib/format";

export type TaskMetadataLabels = {
  added: string;
  completed: string;
  due: string;
  planLabel: string;
};

type TaskMetadataProps = {
  createdAt: Date;
  completedAt?: Date | null;
  dueAt?: Date | null;
  /** Short label when task has recurrence (e.g. "Repeats daily"). */
  recurrenceHint?: string | null;
  isCompleted?: boolean;
  plan?: { id: string; name: string } | null;
  labels: TaskMetadataLabels;
  className?: string;
  /** Plan detail owner rows: due on its own line under added/completed at every breakpoint. */
  stackDueOnDesktop?: boolean;
};

export function TaskMetadata({
  createdAt,
  completedAt,
  dueAt,
  recurrenceHint,
  isCompleted,
  plan,
  labels,
  className = "",
  stackDueOnDesktop = false,
}: TaskMetadataProps) {
  const appLocale = useAppLocale();
  const dueSepClass = stackDueOnDesktop ? "" : "before:content-['·'] before:mr-1";

  const rootClass = stackDueOnDesktop
    ? `mt-1 flex flex-col flex-nowrap items-start gap-y-0.5 break-words text-sm sm:text-xs text-muted ${className}`.trim()
    : `mt-1 flex flex-row flex-wrap gap-x-1 gap-y-0.5 break-words text-sm sm:text-xs text-muted ${className}`.trim();

  return (
    <div className={rootClass}>
      {isCompleted ? (
        <span>
          {labels.completed}{" "}
          {completedAt ? (
            <>
              <span className="max-sm:hidden sm:inline">{formatShortDate(completedAt, appLocale)}</span>
              <span className="max-sm:inline sm:hidden">{formatShortDateOnly(completedAt, appLocale)}</span>
            </>
          ) : (
            "—"
          )}
        </span>
      ) : (
        <span>
          {labels.added}{" "}
          <span className="max-sm:hidden sm:inline">{formatShortDate(createdAt, appLocale)}</span>
          <span className="max-sm:inline sm:hidden">{formatShortDateOnly(createdAt, appLocale)}</span>
        </span>
      )}
      {dueAt ? (
        <span className={dueSepClass || undefined}>
          {labels.due}{" "}
          <span className="max-sm:hidden sm:inline">{formatShortDateTime(dueAt, appLocale)}</span>
          <span className="max-sm:inline sm:hidden">{formatShortDateOnly(dueAt, appLocale)}</span>
        </span>
      ) : null}
      {recurrenceHint ? (
        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
          {recurrenceHint}
        </span>
      ) : null}
      {plan ? (
        <span className="basis-full min-w-0">
          <Link
            href={`/plans/${plan.id}`}
            className="truncate text-accent-blue hover:underline dark:hover:text-blue-300 inline-block max-w-full"
          >
            {labels.planLabel} {plan.name}
          </Link>
        </span>
      ) : null}
    </div>
  );
}
