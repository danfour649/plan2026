"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getTranslations, type Locale, type Messages } from "@/lib/i18n";

type TranslationsContextValue = {
  locale: Locale;
  messages: Messages;
};

const TranslationsContext = createContext<TranslationsContextValue | null>(null);

export function TranslationsProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo((): TranslationsContextValue => {
    return { locale, messages: getTranslations(locale) };
  }, [locale]);
  return <TranslationsContext.Provider value={value}>{children}</TranslationsContext.Provider>;
}

export function useTranslations(): Messages {
  const ctx = useContext(TranslationsContext);
  if (!ctx) {
    throw new Error("useTranslations must be used within a TranslationsProvider");
  }
  return ctx.messages;
}

export function useAppLocale(): Locale {
  const ctx = useContext(TranslationsContext);
  if (!ctx) {
    throw new Error("useAppLocale must be used within a TranslationsProvider");
  }
  return ctx.locale;
}
