import { cache } from "react";
import { cookies } from "next/headers";

import { getServerAuthSession, revalidateAuthSessionCache } from "@/auth";
import {
  DEFAULT_LOCALE,
  getLocaleFromCookie,
  LOCALE_COOKIE,
  LOCALES,
  type Locale,
} from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getThemeFromCookie, THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";

function parseStoredLocale(value: string | null | undefined): Locale | null {
  if (value && LOCALES.includes(value as Locale)) return value as Locale;
  return null;
}

function parseStoredTheme(value: string | null | undefined): Theme | null {
  if (value && THEMES.includes(value as Theme)) return value as Theme;
  return null;
}

/**
 * When signed in, language and theme come from the user row (cross-device). Cookies are a
 * fallback for signed-out routes and are backfilled from cookies once per account when null.
 */
export const resolveAccountPreferences = cache(async (): Promise<{ locale: Locale; theme: Theme }> => {
  const cookieStore = await cookies();
  const cookieLocale = getLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const cookieTheme = getThemeFromCookie(cookieStore.get(THEME_COOKIE)?.value);

  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { locale: cookieLocale, theme: cookieTheme };
  }

  // Prefs are loaded with the session query (see auth.getSessionByToken); avoid a second User SELECT.
  let locale = parseStoredLocale(session.user?.preferredLocale);
  let theme = parseStoredTheme(session.user?.preferredTheme);

  if (locale === null || theme === null) {
    const nextLocale = locale ?? cookieLocale;
    const nextTheme = theme ?? cookieTheme;
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(locale === null ? { preferredLocale: nextLocale } : {}),
        ...(theme === null ? { preferredTheme: nextTheme } : {}),
      },
    });
    await revalidateAuthSessionCache();
    locale = nextLocale;
    theme = nextTheme;
  }

  return { locale: locale ?? DEFAULT_LOCALE, theme: theme ?? "system" };
});

export async function getLocaleForRequest(): Promise<Locale> {
  return (await resolveAccountPreferences()).locale;
}

export async function getThemeForRequest(): Promise<Theme> {
  return (await resolveAccountPreferences()).theme;
}
