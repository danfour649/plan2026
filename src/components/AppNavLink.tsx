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
};

export function AppNavLink({
  href,
  children,
  accent,
  badge,
  ariaLabel,
  className,
}: AppNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const activeClassName =
    accent === "red"
      ? "bg-red-100 text-red-700 ring-1 ring-red-200"
      : "bg-blue-100 text-blue-700 ring-1 ring-blue-200";

  const inactiveClassName =
    accent === "red"
      ? "text-zinc-700 hover:bg-red-50 hover:text-red-600"
      : "text-zinc-700 hover:bg-blue-50 hover:text-blue-700";

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
      className={`group inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition ${isActive ? activeClassName : inactiveClassName} ${className ?? ""}`}
    >
      <span>{children}</span>
      {badge != null && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive
              ? accent === "red"
                ? "bg-white/80 text-red-700"
                : "bg-white/80 text-blue-700"
              : "bg-zinc-100 text-zinc-600 transition group-hover:bg-white group-hover:text-zinc-900"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
