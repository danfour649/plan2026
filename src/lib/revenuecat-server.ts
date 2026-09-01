import { PRO_ENTITLEMENT_ID } from "@/lib/revenuecat-constants";

const SUBSCRIBER_URL = "https://api.revenuecat.com/v1/subscribers";

/** Short TTL so Settings + API auth do not hammer RevenueCat on every request. */
const CACHE_TTL_MS = 60_000;

type CacheEntry = { isPro: boolean; expiresAt: number };

const entitlementCache = new Map<string, CacheEntry>();

type RevenueCatEntitlement = {
  expires_date?: string | null;
  is_active?: boolean;
};

type SubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
  };
};

function isEntitlementActive(entitlement: RevenueCatEntitlement | undefined): boolean {
  if (!entitlement) return false;
  if (typeof entitlement.is_active === "boolean") return entitlement.is_active;
  // Lifetime (and some active rows) use null expires_date.
  if (entitlement.expires_date == null) return true;
  return new Date(entitlement.expires_date).getTime() > Date.now();
}

/**
 * Server-side Pro check via RevenueCat REST.
 * Uses `REVENUECAT_SECRET_API_KEY` (never `NEXT_PUBLIC_*`). Fail-closed when
 * the secret is missing or the request fails.
 */
export async function userHasProEntitlement(appUserId: string): Promise<boolean> {
  if (!appUserId) return false;

  const cached = entitlementCache.get(appUserId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.isPro;
  }

  const secret = process.env.REVENUECAT_SECRET_API_KEY;
  if (!secret) {
    entitlementCache.set(appUserId, { isPro: false, expiresAt: Date.now() + CACHE_TTL_MS });
    return false;
  }

  let isPro = false;
  try {
    const response = await fetch(`${SUBSCRIBER_URL}/${encodeURIComponent(appUserId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
      // Avoid Next.js fetch caching of entitlement status across deploys/users.
      cache: "no-store",
    });

    if (response.ok) {
      const body = (await response.json()) as SubscriberResponse;
      const entitlement = body.subscriber?.entitlements?.[PRO_ENTITLEMENT_ID];
      isPro = isEntitlementActive(entitlement);
    }
  } catch {
    isPro = false;
  }

  entitlementCache.set(appUserId, { isPro, expiresAt: Date.now() + CACHE_TTL_MS });
  return isPro;
}

/** Drop cached Pro status (e.g. after a successful purchase redirect). */
export function invalidateProEntitlementCache(appUserId: string): void {
  entitlementCache.delete(appUserId);
}
