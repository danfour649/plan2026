import { redirect } from "next/navigation";
import Link from "next/link";

import { getServerAuthSession } from "@/auth";
import { AuthErrorAlert } from "@/components/AuthErrorAlert";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { PublicPageShell } from "@/components/PublicPageShell";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getLoginAuthErrorMessage } from "@/lib/auth-errors";
import { isFacebookLoginEnabled } from "@/lib/facebook-login";
import { getTranslations } from "@/lib/i18n";
import { FacebookSignInButton } from "./FacebookSignInButton";
import { GoogleSignInButton } from "./GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await getServerAuthSession();
  const resolved = await searchParams?.catch((): { callbackUrl?: string; error?: string } => ({}));
  const callbackUrl = resolved?.callbackUrl ?? "/tasks";
  const authError = resolved?.error;
  if (session?.user) {
    if (authError) {
      redirect(`/settings?linkError=${encodeURIComponent(authError)}`);
    }
    redirect(callbackUrl);
  }

  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);
  const authErrorMessage = getLoginAuthErrorMessage(t, authError);

  const hasGoogleCredentials = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  const hasFacebookCredentials = isFacebookLoginEnabled();

  return (
    <PublicPageShell locale={locale}>
      <main className="px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-white/90 p-6 shadow-sm shadow-blue-100/60 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40 sm:p-8">
          <Plan2026Logo
            className="mb-6 sm:mb-8"
            iconClassName="h-16 w-20 sm:h-20 sm:w-24"
            ariaLabel={t.common.goToPlans}
          />
          <h1 className="text-xl font-semibold tracking-tight text-blue-950 dark:text-zinc-100 sm:text-2xl">
            {t.login.headline}
          </h1>
          <p className="mt-1.5 text-sm text-tertiary">{t.login.description}</p>

          <p className="mt-4 text-center text-sm">
            <Link
              href="/privacy"
              className="font-semibold text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
            >
              {t.login.privacyLink}
            </Link>
            <span className="text-tertiary"> · </span>
            <Link
              href="/terms"
              className="font-semibold text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
            >
              {t.login.termsLink}
            </Link>
          </p>

          <ul className="mt-5 list-inside list-disc space-y-1.5 text-sm text-secondary" aria-label={t.login.headline}>
            <li>{t.login.benefit1}</li>
            <li>{t.login.benefit2}</li>
            <li>{t.login.benefit3}</li>
          </ul>

          {!hasGoogleCredentials ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t.login.envRequired}
            </div>
          ) : null}

          {authErrorMessage ? (
            <div className="mt-6">
              <AuthErrorAlert
                message={
                  authError === "OAuthAccountNotLinked" ? (
                    <>
                      {authErrorMessage}{" "}
                      <Link
                        href="/settings"
                        className="font-semibold text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {t.nav.settings}
                      </Link>
                      .
                    </>
                  ) : (
                    authErrorMessage
                  )
                }
              />
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-3">
            <GoogleSignInButton
              callbackUrl={callbackUrl}
              disabled={!hasGoogleCredentials}
              label={t.login.continueWithGoogle}
            />
            {hasFacebookCredentials ? (
              <FacebookSignInButton
                callbackUrl={callbackUrl}
                disabled={false}
                label={t.login.continueWithFacebook}
              />
            ) : null}
          </div>

          <p className="mt-4 text-xs text-tertiary">{t.login.calendarNotice}</p>

          <p className="mt-4 text-xs text-tertiary">
            {t.login.privacyNotice}{" "}
            <Link href="/privacy" className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300">
              {t.login.privacyLink}
            </Link>{" "}
            {t.login.termsNoticeAnd}{" "}
            <Link href="/terms" className="font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300">
              {t.login.termsLink}
            </Link>
            .
          </p>
        </div>
      </main>
    </PublicPageShell>
  );
}
