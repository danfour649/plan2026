import type { Metadata } from "next";

import { getCurrentUserId } from "@/auth";
import { getLocaleForRequest, getThemeForRequest } from "@/lib/account-preferences";
import { DisconnectGoogleCalendarButton } from "@/components/DisconnectGoogleCalendarButton";
import { LanguageSelect } from "@/components/LanguageSelect";
import { LinkSignInProviderButton } from "@/components/LinkSignInProviderButton";
import { ReconnectGoogleCalendarButton } from "@/components/ReconnectGoogleCalendarButton";
import { ThemeSelect } from "@/components/ThemeSelect";
import { isFacebookLoginEnabled } from "@/lib/facebook-login";
import { hasGoogleCalendarScope } from "@/lib/google-oauth";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Settings",
};

function ConnectionBadge({ connected, connectedLabel, disconnectedLabel }: {
  connected: boolean;
  connectedLabel: string;
  disconnectedLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        connected
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
      }`}
    >
      {connected ? connectedLabel : disconnectedLabel}
    </span>
  );
}

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const locale = await getLocaleForRequest();
  const theme = await getThemeForRequest();
  const t = getTranslations(locale);

  const linkedAccounts = await prisma.account.findMany({
    where: { userId, provider: { in: ["google", "facebook"] } },
    select: { provider: true, scope: true },
  });

  const googleAccount = linkedAccounts.find((account) => account.provider === "google");
  const hasGoogleLinked = Boolean(googleAccount);
  const hasFacebookLinked = linkedAccounts.some((account) => account.provider === "facebook");
  const isCalendarConnected = hasGoogleCalendarScope(googleAccount?.scope);

  const hasGoogleCredentials = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  const hasFacebookCredentials = isFacebookLoginEnabled();
  const showSignInMethods = hasGoogleCredentials || hasFacebookCredentials;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-blue-950 dark:text-zinc-100">{t.settings.title}</h1>
          <p className="mt-1 text-sm text-tertiary">{t.settings.pageDescription}</p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-blue-50/40 p-5 dark:bg-zinc-800/50">
            <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.settings.theme}</h2>
            <p className="text-sm text-tertiary">{t.settings.themeDescription}</p>
            <ThemeSelect currentTheme={theme} />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-blue-50/40 p-5 dark:bg-zinc-800/50">
            <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.settings.language}</h2>
            <p className="text-sm text-tertiary">{t.settings.languageDescription}</p>
            <LanguageSelect currentLocale={locale} />
          </div>

          {showSignInMethods ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-blue-50/40 p-5 dark:bg-zinc-800/50">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.settings.signInMethods}</h2>
                <p className="text-sm text-tertiary">{t.settings.signInMethodsDescription}</p>
              </div>

              {hasGoogleCredentials ? (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-white/70 p-4 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.settings.googleSignIn}</span>
                    <ConnectionBadge
                      connected={hasGoogleLinked}
                      connectedLabel={t.settings.connected}
                      disconnectedLabel={t.settings.disconnected}
                    />
                  </div>
                  {!hasGoogleLinked ? (
                    <LinkSignInProviderButton
                      provider="google"
                      label={t.settings.linkGoogleAccount}
                      linkingLabel={t.settings.linkingAccount}
                    />
                  ) : null}
                </div>
              ) : null}

              {hasFacebookCredentials ? (
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-white/70 p-4 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-blue-950 dark:text-zinc-100">{t.settings.facebookSignIn}</span>
                    <ConnectionBadge
                      connected={hasFacebookLinked}
                      connectedLabel={t.settings.connected}
                      disconnectedLabel={t.settings.disconnected}
                    />
                  </div>
                  {!hasFacebookLinked ? (
                    <LinkSignInProviderButton
                      provider="facebook"
                      label={t.settings.linkFacebookAccount}
                      linkingLabel={t.settings.linkingAccount}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-blue-50/40 p-5 dark:bg-zinc-800/50 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.settings.googleCalendar}</h2>
                <ConnectionBadge
                  connected={isCalendarConnected}
                  connectedLabel={t.settings.connected}
                  disconnectedLabel={t.settings.disconnected}
                />
              </div>

              <p className="text-sm text-tertiary">
                {isCalendarConnected
                  ? t.settings.calendarConnected
                  : t.settings.calendarDisconnected}
              </p>
            </div>

            {isCalendarConnected ? (
              <DisconnectGoogleCalendarButton />
            ) : (
              <ReconnectGoogleCalendarButton />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
