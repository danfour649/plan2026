import type { ReactNode } from "react";

import { LanguageSelect } from "@/components/LanguageSelect";
import { PublicPageFooter } from "@/components/PublicPageFooter";
import { TranslationsProvider } from "@/components/TranslationsProvider";
import { getTranslations, type Locale } from "@/lib/i18n";

export function PublicPageShell({
  locale,
  children,
  showPrivacyFooter = true,
}: {
  locale: Locale;
  children: ReactNode;
  showPrivacyFooter?: boolean;
}) {
  const t = getTranslations(locale);

  return (
    <TranslationsProvider locale={locale}>
      <div className="min-h-screen bg-transparent text-zinc-950 dark:text-zinc-100">
        <div className="mx-auto flex w-full max-w-2xl justify-end px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-tertiary">{t.settings.language}</span>
            <LanguageSelect currentLocale={locale} />
          </div>
        </div>
        {children}
        {showPrivacyFooter ? <PublicPageFooter /> : null}
      </div>
    </TranslationsProvider>
  );
}
