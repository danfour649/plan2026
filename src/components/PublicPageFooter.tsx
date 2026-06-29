"use client";

import Link from "next/link";

import { useTranslations } from "@/components/TranslationsProvider";

export function PublicPageFooter() {
  const t = useTranslations();

  return (
    <footer className="mx-auto w-full max-w-2xl border-t border-border px-4 py-6 text-center sm:px-6">
      <Link
        href="/privacy"
        className="text-base font-semibold text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
      >
        {t.login.privacyLink}
      </Link>
    </footer>
  );
}
