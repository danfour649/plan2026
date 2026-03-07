"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getTranslations, type Locale, type Messages } from "@/lib/i18n";

const TranslationsContext = createContext<Messages | null>(null);

export function TranslationsProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(() => getTranslations(locale), [locale]);
  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations(): Messages {
  const t = useContext(TranslationsContext);
  if (!t) {
    throw new Error("useTranslations must be used within a TranslationsProvider");
  }
  return t;
}
