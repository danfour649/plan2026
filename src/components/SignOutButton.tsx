"use client";

import { signOut } from "next-auth/react";

import { useTranslations } from "@/components/TranslationsProvider";

export function SignOutButton() {
  const t = useTranslations();
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 transition hover:bg-red-100"
    >
      {t.common.signOut}
    </button>
  );
}

