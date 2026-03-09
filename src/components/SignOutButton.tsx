"use client";

import { signOut } from "next-auth/react";

import { useTranslations } from "@/components/TranslationsProvider";

function ExitDoorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

type SignOutButtonProps = {
  /** When true, label is always visible (e.g. in hamburger menu). */
  alwaysShowLabel?: boolean;
  className?: string;
  /** Optional class for the icon (e.g. h-5 w-5 in menu). */
  iconClassName?: string;
};

export function SignOutButton({
  alwaysShowLabel,
  className,
  iconClassName,
}: SignOutButtonProps = {}) {
  const t = useTranslations();
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label={t.common.signOut}
      className={
        className ??
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 sm:px-3 sm:py-2"
      }
    >
      <ExitDoorIcon className={iconClassName ?? "h-4 w-4 sm:h-4 sm:w-4"} />
      <span className={alwaysShowLabel ? "text-sm" : "hidden sm:inline sm:text-sm"}>
        {t.common.signOut}
      </span>
    </button>
  );
}

