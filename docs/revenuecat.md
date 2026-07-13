# RevenueCat Web Billing integration

Subscriptions for **anthony & omolola enterprises inc. Pro** are implemented with the
[RevenueCat Web SDK](https://www.revenuecat.com/docs/getting-started/installation/web-sdk)
(`@revenuecat/purchases-js`, Web Billing). This document covers the dashboard setup,
the code layout in this repo, and the practices the implementation follows.

## What lives where

| File | Purpose |
|------|---------|
| `src/lib/revenuecat-constants.ts` | Shared entitlement / product id constants (client + server) |
| `src/lib/revenuecat.ts` | Browser SDK configuration, purchase + error handling helpers |
| `src/lib/revenuecat-server.ts` | Server Pro check via RevenueCat REST (`REVENUECAT_SECRET_API_KEY`) |
| `src/components/UpgradePanel.tsx` | Client UI: Pro status, plan cards, RevenueCat Paywall, subscription management |
| `src/app/(app)/upgrade/page.tsx` | Server page at `/upgrade` (sign-in required via the `(app)` layout) |
| `src/lib/i18n.ts` | `upgradePage` + Settings Pro-gate strings (en / fr / pidgin) |

## 1. Install

Already done in this repo:

```bash
pnpm add -w @revenuecat/purchases-js   # npm equivalent: npm install --save @revenuecat/purchases-js
```

## 2. API key configuration

The Web Billing **public** API key is a publishable key and is safe to ship to the
browser. `src/lib/revenuecat.ts` reads it from the environment with a fallback to the
sandbox test key:

```ts
export const REVENUECAT_API_KEY =
  process.env.NEXT_PUBLIC_REVENUECAT_API_KEY ?? "test_FWJQUTIfwdkqrGrUwjilmFoZnrR";
```

For production, set `NEXT_PUBLIC_REVENUECAT_API_KEY` (Vercel → Project → Environment
Variables) to the live Web Billing key (`rcb_...`). Test keys (`test_...`) only work
against RevenueCat's sandbox and never charge real money. Never put a **secret** API
key (`sk_...`) in client code or `NEXT_PUBLIC_*` vars — those are for server-side
REST calls only.

### Secret key (server gating)

Personal API tokens are enforced server-side. Set **`REVENUECAT_SECRET_API_KEY`**
(`sk_...` from RevenueCat → Project settings → API keys) on:

- the **plan2026** web app (Settings create-token + UI Pro status), and
- the **plan2026-api** Vercel project (Bearer token auth rejects non-Pro users)

Without the secret, Pro checks fail closed (no minting, existing tokens cannot
authenticate).

## 3. Dashboard setup (one-time)

1. **Project & app** — In the RevenueCat dashboard create (or open) the project, then
   add a **Web Billing** app. Connect Stripe when prompted; the public API key shown
   there is the one used above.
2. **Products** — Under *Product catalog → Products*, create the three Web Billing
   products with these identifiers (they must match `REVENUECAT_PRODUCT_IDS` in
   `src/lib/revenuecat.ts`):
   - `monthly` — auto-renewing, 1 month period
   - `yearly` — auto-renewing, 1 year period
   - `lifetime` — one-time (non-renewing) purchase
3. **Entitlement** — Under *Product catalog → Entitlements*, create an entitlement with
   the identifier **`anthony & omolola enterprises inc. Pro`** (must match
   `PRO_ENTITLEMENT_ID` in `src/lib/revenuecat.ts`) and attach all three products to
   it. Any purchased product then unlocks Pro.
4. **Offering** — Under *Product catalog → Offerings*, create (or edit) the default
   offering and add three packages: *Monthly* (`$rc_monthly`) → `monthly`, *Annual*
   (`$rc_annual`) → `yearly`, *Lifetime* (`$rc_lifetime`) → `lifetime`. Mark the
   offering as **current**. The app renders whatever the current offering contains, so
   prices/plans can be changed remotely without a deploy.
5. **Paywall (optional but recommended)** — Under *Paywalls*, attach a paywall to the
   offering. The upgrade page detects `offering.hasPaywall` and shows a "View plans
   and pricing" button that renders the dashboard-designed paywall inline via
   `presentPaywall`.

## 4. How the code works

### Configuration & identity (`getPurchases`)

`Purchases.configure({ apiKey, appUserId })` is called once per browser session and the
singleton is reused everywhere (`Purchases.isConfigured()` guard). The signed-in
next-auth user id is used as the RevenueCat **app user id**, so purchases follow the
account across devices. For anonymous visitors a
`Purchases.generateRevenueCatAnonymousAppUserId()` id is created and kept in
`localStorage`; when the visitor signs in, `changeUser` transfers that history onto the
real user.

### Customer info & entitlement checking

```ts
const purchases = await getPurchases(userId);
const customerInfo = await purchases.getCustomerInfo();

if (hasProEntitlement(customerInfo)) {
  // "anthony & omolola enterprises inc. Pro" is in customerInfo.entitlements.active
}
```

Always gate features on the **entitlement**, never on a specific product id — that is
what lets the monthly/yearly/lifetime products interchange freely.
`getProEntitlement(customerInfo)` returns the active `EntitlementInfo` (with
`expirationDate`, `null` for lifetime) for the status UI.

### Purchases & error handling

`purchaseProPackage(pkg, { customerEmail, selectedLocale })` wraps
`purchases.purchase({ rcPackage })` (which opens RevenueCat's hosted checkout) and maps
SDK errors to a discriminated result so the UI never inspects `PurchasesError` itself:

- `ErrorCode.UserCancelledError` → `{ status: "cancelled" }` (info toast, not an error)
- `ErrorCode.ProductAlreadyPurchasedError` → `{ status: "already_owned" }` (refetch info)
- anything else → `{ status: "error", errorCode, message }` (error toast; safe to retry)
- success → `{ status: "purchased", customerInfo }` — the returned `CustomerInfo` is
  already up to date, no extra fetch needed

### RevenueCat Paywall

`UpgradePanel` renders the dashboard paywall inline:

```ts
const result = await purchases.presentPaywall({
  htmlTarget: containerElement,   // omit for a full-screen overlay
  offering,                       // omit to use the current offering
  customerEmail,                  // skips the email step in checkout
  selectedLocale: locale,         // matches the app's i18n locale
});
// resolves with { customerInfo, selectedPackage, ... } after a purchase
```

The promise rejects when the paywall is dismissed without buying; purchase-level errors
are surfaced inside the paywall UI itself.

### Customer Center / subscription management

RevenueCat **Customer Center is mobile-only** (iOS/Android SDKs). The web equivalent is
the hosted customer portal behind `customerInfo.managementURL` — the upgrade page shows
a "Manage subscription" button linking there (cancel, update payment method, invoices).
The paywall's `onVisitCustomerCenter` callback is wired to the same URL. If a native
Customer Center ships for `purchases-js` later, swap the link for that call.

## 5. Best practices followed (and next steps)

- **Entitlement-gated features**, product-agnostic (`PRO_ENTITLEMENT_ID` constant).
- **Stable app user ids** from next-auth; anonymous ids merged on sign-in via `changeUser`.
- **Cancellation is not an error** — handled as a distinct outcome.
- **Remote configuration**: plans, prices, and paywall design come from the current
  offering, so marketing changes need no deploy.
- **Locale-aware checkout** via `selectedLocale` from the app's i18n.
- **Server-side Pro for API tokens**: `userHasProEntitlement` in
  `src/lib/revenuecat-server.ts` calls `GET /v1/subscribers/{app_user_id}` with
  `REVENUECAT_SECRET_API_KEY`. Create-token and Bearer API auth both require an
  active Pro entitlement (60s in-memory cache). Optional later: ingest
  [RevenueCat webhooks](https://www.revenuecat.com/docs/integrations/webhooks) into a
  `User.proUntil` column to avoid per-request REST.
- **Testing**: with the `test_` key, use Stripe test cards (e.g. `4242 4242 4242 4242`)
  in the sandbox checkout; purchases appear in the RevenueCat sandbox dashboard.
