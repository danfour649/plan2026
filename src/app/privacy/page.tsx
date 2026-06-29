import type { Metadata } from "next";
import Link from "next/link";

import { PublicPageShell } from "@/components/PublicPageShell";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const GITHUB_PROFILE_URL = "https://github.com/danfour649";

export default async function PrivacyPage() {
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const phoneHref = `tel:+1${t.privacy.contactPhone.replace(/\D/g, "")}`;
  const deletionMailto = `mailto:${t.privacy.contactEmail}?subject=${encodeURIComponent(t.privacy.contactDeletionEmailSubject)}`;

  return (
    <PublicPageShell locale={locale} showPrivacyFooter={false}>
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/60 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
          <div className="border-b border-border px-6 py-4 sm:px-8">
            <h1 className="text-xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100 sm:text-2xl">
              {t.privacy.title}
            </h1>
            <p className="mt-1 text-sm text-tertiary">{t.privacy.lastUpdated}</p>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-8">
            {t.privacy.sections.map((section) => (
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

            <section>
              <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.privacy.contactTitle}</h2>
              <p className="mt-2 text-sm text-secondary">{t.privacy.contactBody}</p>
              <p className="mt-4">
                <a
                  href={deletionMailto}
                  className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900 underline hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100 dark:hover:bg-blue-950"
                >
                  {t.privacy.contactDeletionLinkLabel}
                </a>
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <span className="font-medium text-blue-950 dark:text-zinc-100">{t.privacy.contactEmailLabel}: </span>
                  <a
                    href={`mailto:${t.privacy.contactEmail}`}
                    className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {t.privacy.contactEmail}
                  </a>
                </li>
                <li>
                  <span className="font-medium text-blue-950 dark:text-zinc-100">{t.privacy.contactPhoneLabel}: </span>
                  <a
                    href={phoneHref}
                    className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {t.privacy.contactPhone}
                  </a>
                </li>
                <li>
                  <span className="font-medium text-blue-950 dark:text-zinc-100">{t.privacy.contactGithubLabel}: </span>
                  <Link
                    href={GITHUB_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    github.com/danfour649
                  </Link>
                </li>
              </ul>
            </section>

            <p className="border-t border-border pt-6 text-sm">
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
