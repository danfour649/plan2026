"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppNavLinkProps = {
  href: string;
  children: React.ReactNode;
  accent: "blue" | "red";
};

export function AppNavLink({ href, children, accent }: AppNavLinkProps) {
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
      className={`rounded-full px-3 py-1.5 transition ${isActive ? activeClassName : inactiveClassName}`}
    >
      {children}
    </Link>
  );
}
