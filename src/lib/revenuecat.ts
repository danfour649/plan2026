import {
  ErrorCode,
  Purchases,
  PurchasesError,
} from "@revenuecat/purchases-js";
import type {
  CustomerInfo,
  EntitlementInfo,
  Offering,
  Package,
  PurchaseResult,
} from "@revenuecat/purchases-js";

/**
 * RevenueCat Web Billing integration (browser-only).
 *
 * The Web Billing public API key is safe to expose client-side (it is a
 * publishable key). Override the test key via NEXT_PUBLIC_REVENUECAT_API_KEY
 * in production. See docs/revenuecat.md for the full setup guide.
 */
export const REVENUECAT_API_KEY =
  process.env.NEXT_PUBLIC_REVENUECAT_API_KEY ?? "test_FWJQUTIfwdkqrGrUwjilmFoZnrR";

/** Entitlement that unlocks all Pro features. Must match the RevenueCat dashboard. */
export const PRO_ENTITLEMENT_ID = "anthony & omolola enterprises inc. Pro";

/** Product identifiers configured in the RevenueCat dashboard. */
export const REVENUECAT_PRODUCT_IDS = {
  lifetime: "lifetime",
  yearly: "yearly",
  monthly: "monthly",
} as const;

/** Display order for packages on the paywall: cheapest commitment first. */
const PACKAGE_DISPLAY_ORDER: readonly string[] = [
  REVENUECAT_PRODUCT_IDS.monthly,
  REVENUECAT_PRODUCT_IDS.yearly,
  REVENUECAT_PRODUCT_IDS.lifetime,
];

const ANONYMOUS_USER_STORAGE_KEY = "PLAN2026_RC_ANONYMOUS_APP_USER_ID";

/**
 * Anonymous app user IDs must stay stable across page loads so purchases made
 * before sign-in are not orphaned; RevenueCat merges them into the real user
 * on `changeUser`.
 */
function getOrCreateAnonymousAppUserId(): string {
  try {
    const existing = window.localStorage.getItem(ANONYMOUS_USER_STORAGE_KEY);
    if (existing) return existing;
    const generated = Purchases.generateRevenueCatAnonymousAppUserId();
    window.localStorage.setItem(ANONYMOUS_USER_STORAGE_KEY, generated);
    return generated;
  } catch {
    // localStorage unavailable (private mode / blocked): fall back to per-load id.
    return Purchases.generateRevenueCatAnonymousAppUserId();
  }
}

/**
 * Configure (or reuse) the Purchases singleton and make sure it is bound to
 * `appUserId`. Pass the signed-in user's stable id; omit it for anonymous
 * visitors. Safe to call on every render — configuration only happens once.
 */
export async function getPurchases(appUserId?: string | null): Promise<Purchases> {
  if (typeof window === "undefined") {
    throw new Error("RevenueCat is browser-only; call getPurchases from client components.");
  }

  if (!Purchases.isConfigured()) {
    return Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserId: appUserId ?? getOrCreateAnonymousAppUserId(),
    });
  }

  const purchases = Purchases.getSharedInstance();
  if (appUserId && purchases.getAppUserId() !== appUserId) {
    // Signed in after browsing anonymously: aliases the anonymous purchases
    // onto the real user and refreshes customer info.
    await purchases.changeUser(appUserId);
  }
  return purchases;
}

/** The active Pro entitlement, or null when the customer is not entitled. */
export function getProEntitlement(customerInfo: CustomerInfo): EntitlementInfo | null {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] ?? null;
}

export function hasProEntitlement(customerInfo: CustomerInfo): boolean {
  return getProEntitlement(customerInfo) !== null;
}

/**
 * Packages of an offering in paywall display order (monthly, yearly,
 * lifetime), falling back to dashboard order for unknown identifiers.
 */
export function sortPackagesForDisplay(offering: Offering): Package[] {
  return [...offering.availablePackages].sort((a, b) => {
    const ai = PACKAGE_DISPLAY_ORDER.indexOf(a.webBillingProduct.identifier);
    const bi = PACKAGE_DISPLAY_ORDER.indexOf(b.webBillingProduct.identifier);
    return (ai === -1 ? PACKAGE_DISPLAY_ORDER.length : ai) - (bi === -1 ? PACKAGE_DISPLAY_ORDER.length : bi);
  });
}

export type PurchaseOutcome =
  | { status: "purchased"; customerInfo: CustomerInfo }
  | { status: "cancelled" }
  | { status: "already_owned" }
  | { status: "error"; errorCode: ErrorCode | null; message: string };

/**
 * Run the Web Billing checkout for a package. Never throws: cancellation and
 * failures are returned as discriminated outcomes so callers can show the
 * right UI without inspecting SDK error classes themselves.
 */
export async function purchaseProPackage(
  rcPackage: Package,
  options?: { customerEmail?: string; selectedLocale?: string },
): Promise<PurchaseOutcome> {
  try {
    const purchases = await getPurchases();
    const result: PurchaseResult = await purchases.purchase({
      rcPackage,
      customerEmail: options?.customerEmail,
      selectedLocale: options?.selectedLocale,
    });
    return { status: "purchased", customerInfo: result.customerInfo };
  } catch (error) {
    if (error instanceof PurchasesError) {
      if (error.errorCode === ErrorCode.UserCancelledError) return { status: "cancelled" };
      if (error.errorCode === ErrorCode.ProductAlreadyPurchasedError) {
        return { status: "already_owned" };
      }
      return { status: "error", errorCode: error.errorCode, message: error.message };
    }
    return {
      status: "error",
      errorCode: null,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * URL of RevenueCat's hosted subscription-management portal for this
 * customer, if any. This is the web equivalent of Customer Center (which is
 * mobile-only): customers can cancel or update billing details there.
 */
export function getManageSubscriptionUrl(customerInfo: CustomerInfo): string | null {
  return customerInfo.managementURL;
}
