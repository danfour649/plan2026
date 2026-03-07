import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/auth";
import { Plan2026Logo } from "@/components/Plan2026Logo";
import { getLocaleFromCookie, getTranslations } from "@/lib/i18n";
import { GoogleSignInButton } from "./GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerAuthSession();
  const resolved = await searchParams?.catch((): { callbackUrl?: string } => ({}));
  const callbackUrl = resolved?.callbackUrl ?? "/tasks";
  if (session?.user) redirect(callbackUrl);

  const locale = getLocaleFromCookie((await cookies()).get("PLAN2026_LOCALE")?.value);
  const t = getTranslations(locale);

  const hasGoogleCredentials = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="min-h-screen bg-transparent px-6 py-16 text-zinc-950">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-blue-100 bg-white/90 p-8 shadow-sm shadow-blue-100/60 backdrop-blur">
        <Plan2026Logo
          className="mb-8"
          iconClassName="h-20 w-24"
          ariaLabel={t.common.goToPlans}
        />
        <h1 className="text-2xl font-semibold tracking-tight text-blue-950">{t.login.title}</h1>
        <p className="mt-2 text-sm text-zinc-600">{t.login.description}</p>

        {!hasGoogleCredentials ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t.login.envRequired}
          </div>
        ) : null}

        <div className="mt-8">
          <GoogleSignInButton
            callbackUrl={callbackUrl}
            disabled={!hasGoogleCredentials}
            label={t.login.continueWithGoogle}
          />
        </div>
      </div>
    </main>
  );
}

