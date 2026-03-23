import { getUrgencyPillClasses } from "@/lib/format";

type UrgencyPillProps = {
  urgency: number;
  title: string;
  completed?: boolean;
  status?: string;
  onHoldLabel?: string;
};

export function UrgencyPill({ urgency, title, completed, status, onHoldLabel }: UrgencyPillProps) {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${getUrgencyPillClasses(urgency)}`}
    >
      <span className={completed ? "truncate line-through" : "truncate"}>{title}</span>
      {status === "on_hold" && onHoldLabel ? (
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {onHoldLabel}
        </span>
      ) : null}
    </div>
  );
}
