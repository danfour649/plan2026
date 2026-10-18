# Meta App Review — supporting documentation (documents-web-1)

Use this folder when submitting **Facebook Login** App Review for Plan 2026.

## What to upload in Meta Developer Console

In **App Review → Permissions and Features** (for `public_profile` and `email`), under **documents-web-1 — Supporting documentation**:

| File | Purpose |
|------|---------|
| **Screencast** (`.mp4` / `.mov`) | Required — follow [screencast-script.txt](./screencast-script.txt) |
| [01-login-page-with-facebook.png](./01-login-page-with-facebook.png) | Login page showing **Continue with Facebook** |
| [plan2026-meta-app-review.zip](./plan2026-meta-app-review.zip) | Optional zip of text instructions + screenshot |

## Copy-paste fields in the submission form

- **Use case / description:** [use-case-description.txt](./use-case-description.txt)
- **Test instructions for reviewers:** [reviewer-instructions.txt](./reviewer-instructions.txt)

## Implementation facts (Oct 2026)

- OAuth endpoints pin Graph API **v26.0** (`FACEBOOK_GRAPH_VERSION` in `src/lib/facebook-login.ts`); scopes requested are exactly `public_profile email`.
- Profile mapping is null-safe (missing picture or no-email Facebook accounts sign in cleanly).
- **Data deletion:** the Meta dashboard uses the instructions URL https://plan2026.ca/privacy#data-deletion (`id="data-deletion"` on the privacy page). An optional HMAC-verified callback exists at `POST /api/facebook/data-deletion`; its status page is https://plan2026.ca/privacy/deletion-status. Meta calls the callback only if that URL replaces the instructions URL.

## Dashboard snapshot (18 October 2026, 2:50 PM Halifax)

App **plan 2026** (App ID `1579063466974896`) belongs to **Anthony & Omolola Enterprises**, which is **Verified**. Data access renewal is complete.

- [x] `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET`, and `AUTH_FACEBOOK_ENABLED=true` in Vercel Production
- [x] Production shows **Continue with Facebook**; authorize URL is Graph `v26.0` with `public_profile email`
- [x] Privacy, Terms, data deletion instructions URL, category, and icon are set
- [x] Redirect URI is only `https://plan2026.ca/api/auth/callback/facebook` (localhost removed). Strict mode and Enforce HTTPS are on
- [x] `public_profile` has Advanced access
- [x] Business verification and data access renewal
- [ ] App domain `plan2026.ca` — being added; confirm it saved
- [ ] `email` is Standard access with **Verification required**
- [ ] Switch from Development to Live (in progress on 18 Oct 2026)

Full checklist: [GO-LIVE-FACEBOOK.md](../../GO-LIVE-FACEBOOK.md)

## Record the screencast

Windows: **Win + G** (Xbox Game Bar) → Record, or **Snipping Tool → Record**.

Until the app shows Live, use a Facebook account that is an Administrator, Developer, or Tester. After Live, any Facebook account can sign in. `email` is still Standard access with Verification required, so a non-role account may sign in without an email until that step finishes.
