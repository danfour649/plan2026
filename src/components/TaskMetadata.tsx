import Link from "next/link";
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
  isCompleted?: boolean;
  plan?: { id: string; name: string } | null;
  labels: TaskMetadataLabels;
};

export function TaskMetadata({
  createdAt,
  completedAt,
  dueAt,
  isCompleted,
  plan,
  labels,
}: TaskMetadataProps) {
  return (
    <div className="mt-1 flex flex-row flex-wrap gap-x-1 gap-y-0.5 break-words text-[0.8125rem] sm:text-xs text-muted">
      {isCompleted ? (
        <span>
          {labels.completed}{" "}
          {completedAt ? (
            <>
              <span className="max-sm:hidden sm:inline">{formatShortDate(completedAt)}</span>
              <span className="max-sm:inline sm:hidden">{formatShortDateOnly(completedAt)}</span>
            </>
          ) : (
            "—"
          )}
        </span>
      ) : (
        <span>
          {labels.added}{" "}
          <span className="max-sm:hidden sm:inline">{formatShortDate(createdAt)}</span>
          <span className="max-sm:inline sm:hidden">{formatShortDateOnly(createdAt)}</span>
        </span>
      )}
      {dueAt ? (
        <span className="before:content-['·'] before:mr-1">
          {labels.due}{" "}
          <span className="max-sm:hidden sm:inline">{formatShortDateTime(dueAt)}</span>
          <span className="max-sm:inline sm:hidden">{formatShortDateOnly(dueAt)}</span>
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
