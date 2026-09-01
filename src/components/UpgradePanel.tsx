"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CustomerInfo, Offering, Package } from "@revenuecat/purchases-js";

import { useAppLocale, useTranslations } from "@/components/TranslationsProvider";
import {
  getManageSubscriptionUrl,
  getProEntitlement,
  getPurchases,
  purchaseProPackage,
  sortPackagesForDisplay,
} from "@/lib/revenuecat";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; customerInfo: CustomerInfo; offering: Offering | null };

function formatEntitlementExpiration(locale: string, expirationDate: Date | null): string | null {
  if (!expirationDate) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(expirationDate);
}

function ProStatusCard({
  customerInfo,
  onCustomerInfoChanged,
}: {
  customerInfo: CustomerInfo;
  onCustomerInfoChanged: (info: CustomerInfo) => void;
}) {
  const t = useTranslations();
  const locale = useAppLocale();
  const entitlement = getProEntitlement(customerInfo);
  const manageUrl = getManageSubscriptionUrl(customerInfo);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const purchases = await getPurchases();
      onCustomerInfoChanged(await purchases.getCustomerInfo());
    } catch {
      toast.error(t.upgradePage.loadFailed);
    } finally {
      setRefreshing(false);
    }
  };

  const expiration = entitlement
    ? formatEntitlementExpiration(locale, entitlement.expirationDate)
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-blue-50/40 p-5 dark:bg-zinc-800/50">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">
          {t.upgradePage.statusTitle}
        </h2>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            entitlement
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
          }`}
        >
          {entitlement ? t.upgradePage.proActive : t.upgradePage.proInactive}
        </span>
      </div>

      <p className="text-sm text-tertiary">
        {entitlement
          ? expiration
            ? t.upgradePage.proRenewsOn.replace("{date}", expiration)
            : t.upgradePage.proLifetime
          : t.upgradePage.proInactiveDescription}
      </p>

      <div className="flex flex-wrap gap-3">
        {manageUrl ? (
          <a
            href={manageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
          >
            {t.upgradePage.manageSubscription}
          </a>
        ) : null}
        <button
          type="button"
          disabled={refreshing}
          onClick={refresh}
          className="rounded-xl border border-border bg-white/70 px-4 py-2 text-sm font-medium text-blue-950 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {refreshing ? t.upgradePage.refreshing : t.upgradePage.refreshStatus}
        </button>
      </div>
    </div>
  );
}

function PackageCard({
  rcPackage,
  disabled,
  onPurchase,
}: {
  rcPackage: Package;
  disabled: boolean;
  onPurchase: (rcPackage: Package) => void;
}) {
  const t = useTranslations();
  const product = rcPackage.webBillingProduct;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white/70 p-4 dark:bg-zinc-900/50">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{product.title}</h3>
        <p className="text-lg font-semibold text-blue-950 dark:text-zinc-100">
          {product.currentPrice.formattedPrice}
          {product.normalPeriodDuration ? (
            <span className="text-xs font-normal text-tertiary"> / {product.normalPeriodDuration}</span>
          ) : null}
        </p>
        {product.description ? <p className="text-sm text-tertiary">{product.description}</p> : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onPurchase(rcPackage)}
        className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
      >
        {t.upgradePage.buy}
      </button>
    </div>
  );
}

export function UpgradePanel({
  appUserId,
  customerEmail,
}: {
  appUserId: string;
  customerEmail?: string | null;
}) {
  const t = useTranslations();
  const locale = useAppLocale();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const paywallContainerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const purchases = await getPurchases(appUserId);
      const [customerInfo, offerings] = await Promise.all([
        purchases.getCustomerInfo(),
        purchases.getOfferings(),
      ]);
      setState({ status: "ready", customerInfo, offering: offerings.current });
    } catch {
      setState({ status: "error" });
    }
  }, [appUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setCustomerInfo = (customerInfo: CustomerInfo) => {
    setState((prev) => (prev.status === "ready" ? { ...prev, customerInfo } : prev));
  };

  const handlePurchase = async (rcPackage: Package) => {
    setPendingPackageId(rcPackage.identifier);
    try {
      const outcome = await purchaseProPackage(rcPackage, {
        customerEmail: customerEmail ?? undefined,
        selectedLocale: locale,
      });
      switch (outcome.status) {
        case "purchased":
          setCustomerInfo(outcome.customerInfo);
          toast.success(t.upgradePage.purchaseSuccess);
          break;
        case "cancelled":
          toast.info(t.upgradePage.purchaseCancelled);
          break;
        case "already_owned":
          toast.info(t.upgradePage.purchaseAlreadyOwned);
          void load();
          break;
        case "error":
          toast.error(t.upgradePage.purchaseFailed);
          break;
      }
    } finally {
      setPendingPackageId(null);
    }
  };

  const openPaywall = async () => {
    if (state.status !== "ready" || !paywallContainerRef.current) return;
    setPaywallOpen(true);
    try {
      const purchases = await getPurchases();
      const result = await purchases.presentPaywall({
        htmlTarget: paywallContainerRef.current,
        offering: state.offering ?? undefined,
        customerEmail: customerEmail ?? undefined,
        selectedLocale: locale,
        onVisitCustomerCenter: () => {
          const url =
            state.status === "ready" ? getManageSubscriptionUrl(state.customerInfo) : null;
          if (url) window.open(url, "_blank", "noopener,noreferrer");
        },
      });
      setCustomerInfo(result.customerInfo);
      toast.success(t.upgradePage.purchaseSuccess);
    } catch {
      // Paywall was closed without a purchase or the purchase failed;
      // purchase-level errors already surface inside the paywall UI.
    } finally {
      setPaywallOpen(false);
    }
  };

  if (state.status === "loading") {
    return <p className="px-1 py-4 text-sm text-tertiary">{t.upgradePage.loading}</p>;
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3 py-2">
        <p className="text-sm text-tertiary">{t.upgradePage.loadFailed}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
        >
          {t.upgradePage.retry}
        </button>
      </div>
    );
  }

  const isPro = getProEntitlement(state.customerInfo) !== null;
  const packages = state.offering ? sortPackagesForDisplay(state.offering) : [];

  return (
    <div className="space-y-4">
      <ProStatusCard customerInfo={state.customerInfo} onCustomerInfoChanged={setCustomerInfo} />

      {!isPro ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-blue-50/40 p-5 dark:bg-zinc-800/50">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">
              {t.upgradePage.choosePlan}
            </h2>
            <p className="text-sm text-tertiary">{t.upgradePage.choosePlanDescription}</p>
          </div>

          {packages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {packages.map((rcPackage) => (
                <PackageCard
                  key={rcPackage.identifier}
                  rcPackage={rcPackage}
                  disabled={pendingPackageId !== null || paywallOpen}
                  onPurchase={handlePurchase}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-tertiary">{t.upgradePage.noPlansAvailable}</p>
          )}

          {state.offering?.hasPaywall ? (
            <div className="space-y-3">
              <button
                type="button"
                disabled={paywallOpen || pendingPackageId !== null}
                onClick={() => void openPaywall()}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
              >
                {t.upgradePage.showPaywall}
              </button>
              <div ref={paywallContainerRef} className={paywallOpen ? "min-h-64" : undefined} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
