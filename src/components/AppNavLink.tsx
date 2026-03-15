"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppNavLinkProps = {
  href: string;
  children: React.ReactNode;
  accent: "blue" | "red";
  badge?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  /** Set false for secondary nav (e.g. Help, About, Settings) to reduce prefetch requests. Default true. */
  prefetch?: boolean;
};

export function AppNavLink({
  href,
  children,
  accent,
  badge,
  ariaLabel,
  className,
  prefetch = true,
}: AppNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const activeClassName =
    accent === "red"
      ? "bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-900/40 dark:text-red-200 dark:ring-red-700"
      : "bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-600";

  const inactiveClassName =
    accent === "red"
      ? "text-zinc-700 hover:bg-red-50 hover:text-red-600 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-red-200"
      : "text-zinc-700 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-blue-200";

  return (
    <Link
      href={href}
      prefetch={prefetch}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
      className={`group inline-flex items-center gap-0 rounded-full px-3 py-1.5 transition sm:gap-2 ${isActive ? activeClassName : inactiveClassName} ${className ?? ""}`}
    >
      <span>{children}</span>
      {badge != null && (
        <span
          className={`inline-flex shrink-0 rounded-full -ml-1 pl-1 pr-2 py-0.5 text-sm font-bold leading-tight sm:ml-0 sm:pl-1.5 sm:pr-2.5 sm:text-base ${
            isActive
              ? accent === "red"
                ? "bg-white/80 text-red-700 dark:bg-zinc-700/80 dark:text-red-200"
                : "bg-white/80 text-blue-700 dark:bg-zinc-700/80 dark:text-blue-200"
              : "bg-zinc-100 text-zinc-600 transition group-hover:bg-white group-hover:text-zinc-900 dark:bg-zinc-700 dark:text-zinc-300 dark:group-hover:bg-zinc-600 dark:group-hover:text-zinc-100"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
