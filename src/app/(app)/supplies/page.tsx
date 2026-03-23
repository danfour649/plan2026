import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUserId } from "@/auth";
import { EditSupplyItemDialog } from "@/components/EditSupplyItemDialog";
import { getLocaleForRequest } from "@/lib/account-preferences";
import { getTranslations } from "@/lib/i18n";
import { getCachedSuppliesPage } from "@/lib/data-cache";

export const metadata: Metadata = {
  title: "Supplies",
};

function getStatusLabelKey(status: string): "statusNeeded" | "statusOrdered" | "statusPending" | "statusPurchased" {
  switch (status) {
    case "ordered":
      return "statusOrdered";
    case "pending":
      return "statusPending";
    case "purchased":
      return "statusPurchased";
    default:
      return "statusNeeded";
  }
}

export default async function SuppliesPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const locale = await getLocaleForRequest();
  const t = getTranslations(locale);

  const { plansWithSupplies } = await getCachedSuppliesPage(userId);

  const plansWithOwner = plansWithSupplies.map((p) => ({
    ...p,
    isOwner: p.userId === userId,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950 dark:text-zinc-100">{t.supplyList.pageTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.supplyList.pageDescription}</p>
      </div>

      {plansWithSupplies.length === 0 ? (
        <section className="rounded-2xl border border-border bg-white/90 px-6 py-8 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
          <p className="text-sm text-muted">{t.supplyList.pageNoItems}</p>
          <p className="mt-2">
            <Link
              href="/plans"
              className="text-sm font-medium text-accent-blue underline hover:text-blue-800 dark:hover:text-blue-300"
            >
              {t.common.goToPlans}
            </Link>
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-white/90 shadow-sm shadow-blue-100/40 backdrop-blur dark:bg-zinc-900/90 dark:shadow-zinc-950/40">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-blue-950 dark:text-zinc-100">{t.supplyList.byPlan}</h2>
          </div>
          <ul className="divide-y divide-blue-100 dark:divide-zinc-700">
            {plansWithOwner.map((plan) => {
              const planTotal = plan.supplyItems.reduce(
                (sum, item) => sum + Number(item.price ?? 0) * (item.quantity ?? 1),
                0,
              );
              return (
                <li key={plan.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/plans/${plan.id}?tab=list`}
                      className="font-medium text-blue-700 hover:text-blue-900 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {plan.name}
                    </Link>
                    {planTotal > 0 ? (
                      <span className="text-sm font-medium text-secondary">
                        {t.supplyList.totalLabel}: {planTotal.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-2 space-y-1.5 pl-2">
                    {plan.supplyItems.map((item) => {
                      const statusKey = getStatusLabelKey(item.acquiredStatus ?? "needed");
                      const statusLabel = t.supplyList[statusKey];
                      const qty = item.quantity ?? 1;
                      return (
                        <li key={item.id} className="flex flex-col gap-1 text-sm">
                          <div className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                              <span className="text-zinc-800 dark:text-zinc-200">{item.label}</span>
                              {qty > 1 ? (
                                <span className="text-muted">× {qty}</span>
                              ) : null}
                              {item.price != null && (
                                <span className="text-muted">
                                  {Number(item.price).toFixed(2)}
                                </span>
                              )}
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                {statusLabel}
                              </span>
                            </div>
                            {plan.isOwner ? (
                              <EditSupplyItemDialog
                                item={{
                                  id: item.id,
                                  planId: plan.id,
                                  planName: plan.name,
                                  label: item.label,
                                  description: item.description ?? null,
                                  price: item.price != null ? Number(item.price) : null,
                                  quantity: item.quantity ?? 1,
                                  acquiredStatus: item.acquiredStatus ?? "needed",
                                  link: item.link ?? null,
                                }}
                                showButton
                              />
                            ) : null}
                          </div>
                          {item.description ? (
                            <span className="pl-3 text-muted">{item.description}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
