"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { setLocale } from "@/lib/actions/settings";

export function LanguageSelect({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Locale;
    if (!LOCALES.includes(value)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("locale", value);
      await setLocale(fd);
      router.refresh();
    });
  }

  return (
    <select
      name="locale"
      value={currentLocale}
      onChange={handleChange}
      disabled={isPending}
      className="w-full max-w-xs rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm disabled:opacity-70"
      aria-label="Language"
    >
      {LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_LABELS[loc]}
        </option>
      ))}
    </select>
  );
}
