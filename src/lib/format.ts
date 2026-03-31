/**
 * Shared date and UI formatting helpers for tasks and plans.
 */

import type { Locale } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n";

/** BCP 47 tag for Intl — must match between Node (SSR) and the browser to avoid hydration mismatches. */
export function intlLocaleTagForAppLocale(locale: Locale): string {
  if (locale === "fr") return "fr-FR";
  if (locale === "pidgin") return "en-GB";
  return "en-US";
}

export function formatShortDate(d: Date, appLocale: Locale = DEFAULT_LOCALE): string {
  const tag = intlLocaleTagForAppLocale(appLocale);
  return d.toLocaleDateString(tag, { month: "short", day: "numeric", year: "numeric" });
}

export function formatShortDateOnly(d: Date, appLocale: Locale = DEFAULT_LOCALE): string {
  const tag = intlLocaleTagForAppLocale(appLocale);
  return d.toLocaleDateString(tag, { month: "short", day: "numeric" });
}

export function formatShortDateTime(d: Date, appLocale: Locale = DEFAULT_LOCALE): string {
  const tag = intlLocaleTagForAppLocale(appLocale);
  return `${formatShortDate(d, appLocale)} ${d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" })}`;
}

/** Task urgency pill Tailwind classes (1–7). */
export function getUrgencyPillClasses(urgency: number): string {
  switch (urgency) {
    case 7:
      return "bg-red-100 text-red-700 ring-1 ring-red-200 dark:bg-red-900/40 dark:text-red-200 dark:ring-red-800";
    case 6:
      return "bg-orange-100 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:ring-orange-800";
    case 5:
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800";
    case 4:
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800";
    case 3:
      return "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:ring-cyan-800";
    case 2:
      return "bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:ring-sky-800";
    default:
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800";
  }
}

/** Plan priority oval Tailwind classes (1–7). */
export function getPriorityOvalClasses(priority: number): string {
  switch (priority) {
    case 7:
      return "rounded-full px-3 py-1 ring-1 ring-red-200 bg-red-50/80 text-red-900";
    case 6:
      return "rounded-full px-3 py-1 ring-1 ring-orange-200 bg-orange-50/80 text-orange-900";
    case 5:
      return "rounded-full px-3 py-1 ring-1 ring-amber-200 bg-amber-50/80 text-amber-900";
    case 4:
      return "rounded-full px-3 py-1 ring-1 ring-emerald-200 bg-emerald-50/80 text-emerald-900";
    case 3:
      return "rounded-full px-3 py-1 ring-1 ring-cyan-200 bg-cyan-50/80 text-cyan-900";
    case 2:
      return "rounded-full px-3 py-1 ring-1 ring-sky-200 bg-sky-50/80 text-sky-900";
    default:
      return "rounded-full px-3 py-1 ring-1 ring-blue-200 bg-blue-50/80 text-blue-900";
  }
}

/** Plan status pill Tailwind classes. */
export function getStatusPillClasses(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    case "abandoned":
      return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200";
    case "started":
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
    case "on_hold":
      return "bg-violet-100 text-violet-700 ring-1 ring-violet-200";
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

