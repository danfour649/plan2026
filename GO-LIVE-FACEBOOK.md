# Go live — Facebook Login for Plan 2026

Use this checklist after the app code is deployed to [plan2026.ca](https://plan2026.ca). Facebook Login is already implemented in the app; what remains is Meta Developer setup, App Review, and production env vars.

**Production URL:** `https://plan2026.ca`  
**Privacy policy:** `https://plan2026.ca/privacy`  
**Terms of service:** `https://plan2026.ca/terms`  
**Facebook OAuth callback:** `https://plan2026.ca/api/auth/callback/facebook`  
**Local dev callback:** `http://localhost:3000/api/auth/callback/facebook`

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
| **User data deletion** | Data deletion instructions URL: `https://plan2026.ca/privacy` (or same page; deletion contact is on that page) |
| **Category** | Productivity or Utilities |
| **App icon** | Plan 2026 logo (1024×1024 if possible) |

Copy **App ID** and **App Secret** — you will set these as `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` in Vercel.

---

## Phase 3 — Facebook Login product

**Facebook Login → Settings:**

| Setting | Value |
|---------|--------|
| **Valid OAuth Redirect URIs** | `https://plan2026.ca/api/auth/callback/facebook` |
| | `http://localhost:3000/api/auth/callback/facebook` (for local testing) |
| **Client OAuth login** | Yes |
| **Web OAuth login** | Yes |
| **Enforce HTTPS** | Yes (production) |
| **Use Strict Mode for redirect URIs** | Yes |

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

In **App Review → Permissions and Features**, request **Advanced Access** for:

- [ ] `public_profile`
- [ ] `email`

Standard Access works only for app roles and test users in Development mode. Advanced Access + Live mode is required for any Facebook user to sign in.

---

## Phase 5 — Business verification

Meta typically requires **Business Verification** before granting Advanced Access for Live Facebook Login.

1. Open **Business Settings** (business.facebook.com) for the Business Manager linked to your app.
2. Complete **Security Center → Business verification** (legal business name, address, phone, documents).
3. If you operate as an individual, you may need a registered business entity (e.g. sole proprietorship or corporation) with matching documentation — Meta’s requirements vary by region.

Verification can take several days. You can still test in **Development** mode while waiting.

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

**Test instructions for reviewers:**  
“Open https://plan2026.ca/login and click Continue with Facebook. No separate app account is required.”

**Data handling:** Answer Meta’s data handling questions honestly: email and profile are stored in our PostgreSQL database for authentication and display; not sold; deletion via privacy policy contact.

### After approval

- [ ] Permissions show **Ready for live mode**
- [ ] Switch app from **Development** to **Live** (top of App Dashboard)

---

## Phase 7 — Vercel production env

In **Vercel → plan2026 → Settings → Environment Variables** (Production):

| Variable | Value |
|----------|--------|
| `AUTH_FACEBOOK_ID` | App ID from Meta Settings → Basic |
| `AUTH_FACEBOOK_SECRET` | App Secret (click Show) |
| `AUTH_FACEBOOK_ENABLED` | Set to `true` (required for the login button; enabled for App Review submission) |

**Re-enable / App Review:** Set `AUTH_FACEBOOK_ENABLED=true` in Vercel Production before submitting App Review so reviewers see **Continue with Facebook** on `/login`. After approval, switch the Meta app to **Live** so all Facebook users can sign in (not only test users).

`NEXTAUTH_URL` must already be `https://plan2026.ca` (no trailing slash).

After saving: **Redeploy** Production.

---

## Phase 8 — End-to-end verification

On `https://plan2026.ca`:

- [ ] `/login` shows **Continue with Facebook** (below Google).
- [ ] Facebook sign-in completes without “redirect URI” errors.
- [ ] User lands on `/tasks` with a session.
- [ ] Sign out and sign in again works.
- [ ] Check Vercel **Functions / Logs** on failure.

**Development mode only:** Add Facebook accounts under **App roles → Test users** (or as Administrators/Developers) until the app is Live.

---

## Common failures

| Symptom | Likely cause |
|---------|----------------|
| Button missing on `/login` | `AUTH_FACEBOOK_ID` or `AUTH_FACEBOOK_SECRET` not set in Vercel, or Production not redeployed |
| “URL blocked” / redirect error | Callback URI not listed exactly in Facebook Login settings |
| “App not active” / login unavailable | App still in Development and user is not a test user or app role |
| “App needs advanced access” | Submit App Review for `email` and `public_profile`; complete business verification |
| Sign-in loops to `/login` | Wrong `NEXTAUTH_URL`, missing `AUTH_SECRET`, or database/session error |
| No email from Facebook | User’s Facebook account has no email, or `email` permission not approved |

---

## Quick test before App Review (Development mode)

1. Set `AUTH_FACEBOOK_*` in local `.env` (never commit).
2. Run `pnpm dev`, open `http://localhost:3000/login`.
3. Use a Facebook account listed as Developer/Administrator/Test user on the Meta app.
4. Confirm redirect to `http://localhost:3000/api/auth/callback/facebook` works.

Then repeat on production with your own account before submitting App Review.

---

## Related docs

- App code: `src/auth.ts`, `src/app/login/FacebookSignInButton.tsx`
- Env reference: [README.md](./README.md#facebook-login-optional)
- Google go-live: [GO-LIVE.md](./GO-LIVE.md)
