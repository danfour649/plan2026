import type { Metadata } from "next";

import { getServerAuthSession } from "@/auth";
import { UpgradePanel } from "@/components/UpgradePanel";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Upgrade",
};

export default async function UpgradePage() {
  const session = await getServerAuthSession();
  const user = session?.user;
  if (!user?.id) return null;

  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-blue-950 dark:text-zinc-100">
            {t.upgradePage.title}
          </h1>
          <p className="mt-1 text-sm text-tertiary">{t.upgradePage.pageDescription}</p>
        </div>

        <div className="px-6 py-6">
          <UpgradePanel appUserId={user.id} customerEmail={user.email} />
        </div>
      </section>
    </div>
  );
}
