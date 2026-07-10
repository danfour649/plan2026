# Resources — TODO

Operational notes, testing checklists, and follow-ups that do not belong in roadmap analysis docs.

---

## Billing — RevenueCat Web Billing next steps

**Added:** 2026-07-10  
**Context:** RevenueCat SDK integration (`@revenuecat/purchases-js`) — `/upgrade` page, Pro entitlement gating, paywall, and management link. Setup guide: [docs/revenuecat.md](../docs/revenuecat.md). Code: `src/lib/revenuecat.ts`, `src/components/UpgradePanel.tsx`.

### Follow-ups

- [ ] **Dashboard setup:** create the Web Billing app (connect Stripe), products `monthly` / `yearly` / `lifetime`, entitlement `anthony & omolola enterprises inc. Pro` with all three products attached, and the current offering with `$rc_monthly` / `$rc_annual` / `$rc_lifetime` packages (see docs/revenuecat.md §3)
- [ ] **Paywall design:** attach a paywall to the current offering in the dashboard so the "View plans and pricing" button appears on `/upgrade`
- [ ] **Production key:** set `NEXT_PUBLIC_REVENUECAT_API_KEY` in Vercel to the live `rcb_...` key (code falls back to the sandbox `test_...` key)
- [ ] **Server-side entitlement checks:** client checks are UX-only — gate API routes/RSC via RevenueCat REST (`GET /v1/subscribers/{app_user_id}` with a secret key) or ingest webhooks into a `User.proUntil` column
- [ ] **Navigation:** add an Upgrade link (nav or `/settings`) — `/upgrade` is currently only reachable by URL
- [ ] **Sandbox test pass:** Stripe test card `4242 4242 4242 4242` through purchase, cancel, already-owned, and management-portal flows in en/fr/pidgin

---

## Auth — Settings account linking (Google + Facebook)

**Added:** 2026-06-30  
**Context:** PR #107 — link Google or Facebook from `/settings` while signed in. Same OAuth callback URLs as login (`/api/auth/callback/google`, `/api/auth/callback/facebook`). No `/settings` entry in Meta or Google consoles.

### Intended flow (same email on Gmail and Facebook)

This is the normal case, not an edge case:

1. Sign in with the provider you used first (e.g. Google).
2. Open **Settings → Sign-in methods → Link Facebook account** (or Link Google).
3. Complete OAuth consent; land back on `/settings` with the provider **Connected**.
4. Sign out; sign in with **either** provider → same user, same tasks.

Cold sign-in with the second provider on `/login` when the email already exists on another method → `OAuthAccountNotLinked` (by design). Use Settings to link instead.

### When Gmail and Facebook share one email — how to test

| Goal | Approach |
|------|----------|
| Test **linking** (happy path) | Sign in with Google → Settings → Link Facebook. Same email is expected to work. |
| Test **Facebook login alone** | Use a **Meta test user** with a different email (App roles → Test users), or remove duplicate Facebook-only `User` / `Account` rows from the DB first. |
| Test **Google login alone** | Use a second Google account, or remove the Facebook `Account` row for that user in the DB. |
| Local dev without real Google | `pnpm exec tsx -r dotenv/config scripts/seed-dev-session.ts` → set `next-auth.session-token` cookie → `/settings` → link a provider. |

### Common failures (Facebook configured but linking still fails)

- **Duplicate users:** Facebook was used on `/login` before linking, creating a separate `User` for the same person. Linking then fails: account already associated with another user. Fix: delete the orphan Facebook-only user (and `Account` rows) in the DB, then link again from Settings.
- **Session lost during OAuth:** Cookie blocked or private browsing → callback treats flow as cold sign-in → `OAuthAccountNotLinked`. Use a normal browser tab; allow cookies for the app domain.
- **Facebook email permission:** App in Development without `email` approved, or user denied email → cold sign-in issues; linking while signed in should still work if session survives the round-trip.
- **Button appears stuck on “Linking…”:** Check DevTools → Network for `POST /api/auth/signin/facebook`. Should return `{ url: "https://www.facebook.com/..." }` and redirect. If login with Facebook on `/login` works on the same URL, OAuth config is fine.

### References

- [GO-LIVE-FACEBOOK.md](../GO-LIVE-FACEBOOK.md) — Meta redirect URIs, env vars, App Review
- [GO-LIVE.md](../GO-LIVE.md) — Google callback URI
- [scripts/seed-dev-session.ts](../scripts/seed-dev-session.ts) — local session without OAuth

### Follow-ups (optional)

- [ ] Add “Testing with same email” subsection to `GO-LIVE-FACEBOOK.md` (or link here)
- [ ] Script or admin note to list duplicate `User` rows by email for auth cleanup
