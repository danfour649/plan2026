import type { Metadata } from "next";
import Link from "next/link";

import { PublicPageShell } from "@/components/PublicPageShell";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: {
    canonical: "/terms",
  },
};

export default async function TermsPage() {
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);

  return (
    <PublicPageShell locale={locale} showPrivacyFooter={false}>
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/60 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
          <div className="border-b border-border px-6 py-4 sm:px-8">
            <h1 className="text-xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100 sm:text-2xl">
              {t.terms.title}
            </h1>
            <p className="mt-1 text-sm text-tertiary">{t.terms.lastUpdated}</p>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-8">
            {t.terms.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{section.title}</h2>
                <div className="mt-2 space-y-2">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm text-secondary">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <p className="border-t border-border pt-6 text-sm text-secondary">
              {t.terms.privacyReference}{" "}
              <Link href="/privacy" className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300">
                {t.login.privacyLink}
              </Link>
              .
            </p>

            <p className="text-sm">
              <Link href="/login" className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300">
                {t.login.title}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}
