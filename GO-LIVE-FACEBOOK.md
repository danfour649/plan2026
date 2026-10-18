# Go live — Facebook Login for Plan 2026

Use this checklist for the Meta app **plan 2026**. Facebook Login is implemented and the production authorize URL already pins Graph API **v26.0** with scope `public_profile email`.

**Production URL:** `https://plan2026.ca`  
**Privacy policy:** `https://plan2026.ca/privacy`  
**Terms of service:** `https://plan2026.ca/terms`  
**Facebook OAuth callback:** `https://plan2026.ca/api/auth/callback/facebook`  
**Deletion instructions URL (configured in Meta):** `https://plan2026.ca/privacy#data-deletion`  
**Optional Data Deletion Callback:** `https://plan2026.ca/api/facebook/data-deletion` (status page: `https://plan2026.ca/privacy/deletion-status`)

**Code facts:** `FACEBOOK_GRAPH_VERSION` in `src/lib/facebook-login.ts` is **v26.0** (newest Graph API version listed in October 2026). NextAuth v4's built-in provider still points at the retired v11.0; `src/auth.ts` overrides authorization, token, and userinfo. Requested scopes are exactly `public_profile email`. Production `POST /api/auth/signin/facebook` returns `https://www.facebook.com/v26.0/dialog/oauth` with that scope and the production redirect URI.

---

## Dashboard snapshot — 18 October 2026, 2:50 PM Halifax (ADT)

App **plan 2026**, App ID `1579063466974896`, belongs to the business **Anthony & Omolola Enterprises**, which is **Verified**. Data access renewal is complete.

### Already set

- [x] Privacy Policy URL `https://plan2026.ca/privacy`
- [x] Terms of Service URL `https://plan2026.ca/terms`
- [x] User data deletion **instructions** URL `https://plan2026.ca/privacy#data-deletion` (the live privacy page has `id="data-deletion"` on “How to delete your data”)
- [x] Category: Productivity
- [x] App icon (`public/meta-app-icon-1024.png`)
- [x] `public_profile`: **Advanced access**
- [x] Valid OAuth Redirect URI is only `https://plan2026.ca/api/auth/callback/facebook` (localhost was removed)
- [x] Use Strict Mode for redirect URIs: ON
- [x] Enforce HTTPS: ON
- [x] Vercel Production already has `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET`, and `AUTH_FACEBOOK_ENABLED`. Do not change them for this step.

### Still to finish

- [ ] **App domains:** `plan2026.ca` is being added under Settings → Basic. Confirm the field saved.
- [ ] **`email` permission:** Standard access, status **Verification required**. Finish that Meta step so `email` can move to Advanced access. Until then, a Facebook account that is not an app role may sign in without an email. The app allows a null email (`User.email` is nullable).
- [ ] **Go Live:** the app is being switched from **Development** to **Live** on 18 October 2026. Confirm the dashboard shows Live.
- [ ] **End-to-end on https://plan2026.ca** with a Facebook account that is not an admin, developer, or tester: cold sign-in lands on `/tasks`; link Facebook from Settings while signed in with Google; sign out and back in with each provider; check Vercel function logs on any failure.

Do not put `http://localhost:3000/api/auth/callback/facebook` back on the redirect list unless you are testing locally. Strict mode is on, so a URI that is not listed is rejected. Remove it again before relying on the production-only list.

The Data Deletion Callback is optional. The dashboard uses the instructions URL. Leave it that way unless you switch User data deletion to `https://plan2026.ca/api/facebook/data-deletion`. The callback is implemented and covered by unit tests; it runs only when Meta posts a `signed_request`.

---

## Phase 1 — Create Meta developer account and app

1. Sign up at [developers.facebook.com](https://developers.facebook.com/) (use the same email you want as app contact).
2. **My Apps → Create App** → choose **Authenticate and request data from users with Facebook Login** (or add **Facebook Login** to an existing app).
3. App display name: **Plan 2026** (or match your branding).
4. Link the app to a **Meta Business Manager** when prompted (required before Live mode for external users).

---

## Phase 2 — App settings (Settings → Basic)

| Field | Value |
|-------|--------|
| **App domains** | `plan2026.ca` |
| **Privacy Policy URL** | `https://plan2026.ca/privacy` |
| **Terms of Service URL** | `https://plan2026.ca/terms` |
| **User data deletion** | Instructions URL (already set): `https://plan2026.ca/privacy#data-deletion`. Optional callback, only if you replace the instructions URL: `https://plan2026.ca/api/facebook/data-deletion` |
| **Category** | Productivity |
| **App icon** | `public/meta-app-icon-1024.png` (1024×1024) |

App ID `1579063466974896` and the App Secret are already `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` in Vercel Production. App domain `plan2026.ca` was still being saved on 18 Oct 2026 — confirm Settings → Basic shows it. Privacy, Terms, the deletion instructions URL, category, and icon are already set.

---

## Phase 3 — Facebook Login product

**Facebook Login → Settings:**

| Setting | Value |
|---------|--------|
| **Valid OAuth Redirect URIs** | `https://plan2026.ca/api/auth/callback/facebook` only (localhost removed, 18 Oct 2026) |
| **Client OAuth login** | Yes |
| **Web OAuth login** | Yes |
| **Enforce HTTPS** | ON (confirmed 18 Oct 2026) |
| **Use Strict Mode for redirect URIs** | ON (confirmed 18 Oct 2026) |

**Allowed domains for the JavaScript SDK** (if shown): `plan2026.ca`

Plan 2026 uses server-side OAuth only (NextAuth); no Facebook JS SDK on the page.

---

## Phase 4 — Permissions

Plan 2026 requests only:

| Permission | Why |
|------------|-----|
| `public_profile` | Name and profile picture for the signed-in user |
| `email` | Account identity (required for NextAuth session) |

Do **not** request extra permissions (friends, pages, posting, etc.).

In **App Review → Permissions and Features** (status on 18 Oct 2026):

- [x] `public_profile` — Advanced access
- [ ] `email` — Standard access, **Verification required**. Complete Meta’s verification so this can move to Advanced access.

Standard access for `email` is enough for people with a role on the app. Any Facebook user needs Advanced access (and Live mode) before Meta reliably returns an email. Sign-in still completes when Graph omits `email`.

---

## Phase 5 — Business verification

- [x] The app belongs to **Anthony & Omolola Enterprises**, which is **Verified** (18 Oct 2026).
- [x] Data access renewal is complete.

Meta requires a verified business before Advanced Access for Live Facebook Login. That step is done for this app. The remaining permission gate is `email` (“Verification required”), not business verification.

---

## Phase 6 — App Review submission

When Advanced Access shows **Verification required** or **Ready for testing**, submit App Review.

### What to provide

**Supporting documentation (documents-web-1):** Upload a screencast (`.mp4` / `.mov`, under ~2 minutes) plus optional screenshots. Ready-made copy and a login screenshot live in **[docs/meta-app-review/](./docs/meta-app-review/)** (includes `plan2026-meta-app-review.zip` for upload).

**Use case (short):**  
Plan 2026 is a task and plan planner. Facebook Login lets users sign in with their Facebook account. We only read `public_profile` and `email` to create a session and show their name and avatar in the app. We do not post to Facebook, read friends, or access other Facebook data.

**Screencast (required):** Record a video showing:

1. Open `https://plan2026.ca/login` (or localhost if env vars are set there).
2. Click **Continue with Facebook**.
3. Complete Facebook consent.
4. Land on `/tasks` signed in (user name visible).
5. Optional: sign out and sign in again.

Keep the video under ~2 minutes. No login/password needed for reviewers if they can use their own Facebook account on the production URL.

**Test instructions for reviewers** (paste into Meta’s “Provide testing instructions” field):

Open https://plan2026.ca/login in a desktop or mobile browser. No separate Plan 2026 account is required. Click Continue with Facebook, sign in with your Facebook account, and approve public_profile and email. You are redirected to https://plan2026.ca/tasks, signed in, with your name in the header. Plan 2026 uses those two permissions only to sign you in and to display your name and profile picture. It does not post to Facebook, read your friends, or access any other Facebook data. Privacy policy: https://plan2026.ca/privacy. Data deletion instructions: https://plan2026.ca/privacy#data-deletion.

**Data handling:** Answer Meta’s data handling questions honestly: email and profile are stored in our PostgreSQL database for authentication and display; not sold; deletion via privacy policy contact.

### After `email` is approved

- [ ] `email` shows Advanced access (or Ready for live mode)
- [ ] App mode is **Live** (switch started 18 Oct 2026 — confirm it finished)

---

## Phase 7 — Vercel production env

In **Vercel → plan2026 → Settings → Environment Variables** (Production):

| Variable | Value |
|----------|--------|
| `AUTH_FACEBOOK_ID` | App ID `1579063466974896` — already set in Vercel Production |
| `AUTH_FACEBOOK_SECRET` | App Secret — already set in Vercel Production. Do not commit it. |
| `AUTH_FACEBOOK_ENABLED` | Already `true` in Vercel Production |

`NEXTAUTH_URL` must stay `https://plan2026.ca` (no trailing slash).

No Vercel change is required for the 18 Oct 2026 dashboard update. Redeploy Production after the privacy-copy PR merges so the live policy matches the instructions URL.

---

## Phase 8 — End-to-end verification

On `https://plan2026.ca`:

- [ ] `/login` shows **Continue with Facebook** (below Google).
- [ ] Facebook sign-in completes without “redirect URI” errors.
- [ ] User lands on `/tasks` with a session.
- [ ] Sign out and sign in again works.
- [ ] Link Facebook from **Settings → Sign-in methods** while signed in with Google (same email), then sign in with either provider.
- [ ] Data deletion instructions: open `https://plan2026.ca/privacy#data-deletion` and confirm the “How to delete your data” section is in view. The dashboard uses that URL. The callback at `/api/facebook/data-deletion` is optional and is not what Meta calls today.
- [ ] Check Vercel **Functions / Logs** on failure.

Until the app shows **Live**, only Facebook accounts with an app role (Administrator, Developer, or Tester) can sign in.

---

## Common failures

| Symptom | Likely cause |
|---------|----------------|
| Button missing on `/login` | `AUTH_FACEBOOK_ID` or `AUTH_FACEBOOK_SECRET` not set in Vercel, or Production not redeployed |
| “URL blocked” / redirect error | Callback URI not listed exactly in Facebook Login settings |
| “App not active” / login unavailable | App still in Development and the Facebook account has no app role |
| “App needs advanced access” / email missing for non-role users | `email` is still Standard with Verification required. `public_profile` already has Advanced access. Business verification is done. |
| Sign-in loops to `/login` | Wrong `NEXTAUTH_URL`, missing `AUTH_SECRET`, or database/session error |
| Facebook account has no email | Phone-number Facebook accounts may return no email — sign-in still works and the Plan 2026 account is created without an email (handled in `mapFacebookProfile`). If emails are missing for everyone, check `email` Advanced Access |

---

## Local Facebook login

The production Meta app does not list a localhost redirect URI. Local “Continue with Facebook” will fail with a redirect error until you temporarily add `http://localhost:3000/api/auth/callback/facebook`, test, and remove it again (Strict mode is on).

1. Set `AUTH_FACEBOOK_*` in local `.env` (never commit).
2. Run `pnpm dev`, open `http://localhost:3000/login`.
3. Use a Facebook account listed as Developer, Administrator, or Tester while the app is in Development.

### Testing with the same email on Gmail and Facebook

When Google and Facebook share one email, **linking from Settings is the happy path** — not a cold second-provider sign-in on `/login`.

1. Sign in with the first provider (e.g. Google).
2. Open **Settings → Sign-in methods → Link Facebook account** (or Link Google).
3. Complete OAuth; both providers show **Connected**.
4. Sign out; sign in with **either** provider → same user and tasks.

Cold sign-in with the second provider on `/login` when that email already exists → `OAuthAccountNotLinked` (by design). Use Settings to link instead.

| Goal | Approach |
|------|----------|
| Test **linking** | Sign in with Google → Settings → Link Facebook (same email is fine). |
| Test **Facebook-only** login | Meta **test user** with a different email, or remove orphan Facebook-only `User`/`Account` rows first. |
| Local session without Google | `pnpm exec tsx -r dotenv/config scripts/seed-dev-session.ts` → set `next-auth.session-token` cookie → `/settings` → link a provider. |

More detail and failure modes: [Resources/TODO.md](./Resources/TODO.md) (Auth — Settings account linking).

---

## Related docs

- App code: `src/auth.ts`, `src/app/login/FacebookSignInButton.tsx`
- Env reference: [README.md](./README.md#facebook-login-optional)
- Google go-live: [GO-LIVE.md](./GO-LIVE.md)
