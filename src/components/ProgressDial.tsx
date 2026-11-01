export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Radial progress dial (pure SVG, server-rendered — no client JS).
 * The percentage is exposed via aria-label; the visible center label is
 * decorative duplication for sighted users.
 */
export function ProgressDial({
  value,
  size = 96,
  strokeWidth = 9,
  ariaLabel,
  caption,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  ariaLabel: string;
  caption?: string;
}) {
  const percent = clampPercent(value);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const center = size / 2;
  const complete = percent >= 100;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-blue-100 dark:stroke-zinc-700"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={
            complete ? "stroke-emerald-500 dark:stroke-emerald-400" : "stroke-blue-600 dark:stroke-blue-400"
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span
          className="font-semibold tabular-nums text-blue-950 dark:text-zinc-50"
          style={{ fontSize: Math.max(14, Math.round(size * 0.24)) }}
        >
          {percent}%
        </span>
        {caption ? (
          <span className="px-2 text-center text-[11px] leading-tight text-muted">{caption}</span>
        ) : null}
      </div>
    </div>
  );
}
