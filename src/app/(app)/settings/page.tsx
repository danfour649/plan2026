import type { Metadata } from "next";
import { cookies } from "next/headers";

import { getCurrentUserId } from "@/auth";
import { DisconnectGoogleCalendarButton } from "@/components/DisconnectGoogleCalendarButton";
import { ReconnectGoogleCalendarButton } from "@/components/ReconnectGoogleCalendarButton";
import { LanguageSelect } from "@/components/LanguageSelect";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      access_token: true,
      refresh_token: true,
    },
  });

  const isCalendarConnected = Boolean(account?.refresh_token || account?.access_token);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur">
        <div className="border-b border-blue-100 px-6 py-4">
          <h1 className="text-lg font-semibold text-blue-950">{t.settings.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t.settings.pageDescription}</p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
            <h2 className="text-sm font-semibold text-blue-950">{t.settings.language}</h2>
            <p className="text-sm text-zinc-600">{t.settings.languageDescription}</p>
            <LanguageSelect currentLocale={locale} />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-sm font-semibold text-blue-950">{t.settings.googleCalendar}</h2>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    isCalendarConnected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {isCalendarConnected ? t.settings.connected : t.settings.disconnected}
                </span>
              </div>

              <p className="text-sm text-zinc-600">
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
