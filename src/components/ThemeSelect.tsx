"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useTranslations } from "@/components/TranslationsProvider";
import { setTheme } from "@/lib/actions/settings";
import { THEMES, type Theme } from "@/lib/theme";

export function ThemeSelect({ currentTheme }: { currentTheme: Theme }) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Theme;
    if (!THEMES.includes(value)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("theme", value);
      await setTheme(fd);
      router.refresh();
    });
  }

  const themeLabels: Record<Theme, string> = {
    light: t.settings.themeLight,
    dark: t.settings.themeDark,
    system: t.settings.themeSystem,
  };

  return (
    <select
      name="theme"
      value={currentTheme}
      onChange={handleChange}
      disabled={isPending}
      className="w-full max-w-xs rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      aria-label={t.settings.theme}
    >
      {THEMES.map((theme) => (
        <option key={theme} value={theme}>
          {themeLabels[theme]}
        </option>
      ))}
    </select>
  );
}
