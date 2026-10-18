import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { PublicPageShell } from "@/components/PublicPageShell";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Data deletion status",
  alternates: {
    canonical: "/privacy/deletion-status",
  },
};

/**
 * Status page for Meta's Data Deletion Callback. Facebook shows the user a
 * confirmation code and a link here after they remove the app; the callback
 * (POST /api/facebook/data-deletion) stores the outcome under that code.
 */
export default async function DeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // Per-request page (looks up a deletion record by confirmation code);
  // Cache Components forbids `export const dynamic`, so opt in via connection().
  await connection();
  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const s = t.privacy.deletionStatus;
  const { code } = await searchParams;

  const record = code
    ? await prisma.dataDeletionRequest.findUnique({ where: { confirmationCode: code } })
    : null;

  const message = !code
    ? s.missingCode
    : !record
      ? s.notFound
      : record.status === "completed"
        ? s.completed
        : s.noAccount;

  return (
    <PublicPageShell locale={locale} showPrivacyFooter={false}>
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/60 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
          <div className="border-b border-border px-6 py-4 sm:px-8">
            <h1 className="text-xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100 sm:text-2xl">
              {s.title}
            </h1>
            {code ? (
              <p className="mt-1 text-sm text-tertiary">
                {s.codeLabel}: <span className="font-mono">{code}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <p className="text-sm text-secondary">{message}</p>
            <p className="border-t border-border pt-6 text-sm">
              <Link
                href="/privacy"
                className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
              >
                {s.backToPrivacy}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}
