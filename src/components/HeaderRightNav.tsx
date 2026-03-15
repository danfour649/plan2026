"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

import { AppNavLink } from "@/components/AppNavLink";
import { SignOutButton } from "@/components/SignOutButton";
import { useTranslations } from "@/components/TranslationsProvider";

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1.12-1.57 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.57-1.12 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1.12 1.57 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c0 .68.4 1.3 1.04 1.56H21a2 2 0 0 1 0 4h-.09c-.68 0-1.3.4-1.56 1.04Z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function AboutIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function HeaderRightNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClickOutside);
    };
  }, [menuOpen]);

  const navLinks = (
    <>
      <AppNavLink href="/help" accent="blue" prefetch={false} className="shrink-0 px-2 py-1.5 text-sm">
        {t.nav.help}
      </AppNavLink>
      <AppNavLink href="/about" accent="blue" prefetch={false} className="shrink-0 px-2 py-1.5 text-sm">
        {t.nav.about}
      </AppNavLink>
      <AppNavLink
        href="/settings"
        accent="blue"
        prefetch={false}
        ariaLabel={t.nav.settings}
        className="shrink-0 p-1.5 sm:px-2.5 sm:py-2"
      >
        <SettingsIcon className="h-4 w-4" />
      </AppNavLink>
    </>
  );

  return (
    <div className="relative z-0 flex shrink-0 items-center justify-end gap-1 pl-2 sm:gap-3 sm:pl-0">
      {/* Desktop: Help, About, Settings, Sign out */}
      <div className="hidden items-center gap-1 md:flex md:gap-3">
        {navLinks}
        <SignOutButton />
      </div>

      {/* Mobile: hamburger + dropdown */}
      <div className="relative flex items-center gap-2 md:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          aria-label={t.nav.menu ?? "Menu"}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/80 p-2.5 text-blue-700 transition hover:bg-blue-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-xl border border-blue-100 bg-white py-2 shadow-lg shadow-blue-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-950/50"
            role="menu"
          >
            <Link
              href="/help"
              prefetch={false}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm ${pathname === "/help" ? "bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200" : "text-zinc-700 hover:bg-blue-50 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
            >
              <HelpIcon className="h-5 w-5 shrink-0" />
              {t.nav.help}
            </Link>
            <Link
              href="/about"
              prefetch={false}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm ${pathname === "/about" ? "bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200" : "text-zinc-700 hover:bg-blue-50 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
            >
              <AboutIcon className="h-5 w-5 shrink-0" />
              {t.nav.about}
            </Link>
            <Link
              href="/settings"
              prefetch={false}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm ${pathname === "/settings" ? "bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200" : "text-zinc-700 hover:bg-blue-50 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
            >
              <SettingsIcon className="h-5 w-5 shrink-0" />
              {t.nav.settings}
            </Link>
            <div className="mt-2 border-t border-blue-100 pt-2 dark:border-zinc-700">
              <div className="px-2 pb-1">
                <SignOutButton
                  alwaysShowLabel
                  iconClassName="h-5 w-5 shrink-0"
                  className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm text-red-700 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-zinc-800"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
