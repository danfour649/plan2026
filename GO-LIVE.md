# Go live — Plan 2026 demo checklist

Use this before advertising [plan2026.ca](https://plan2026.ca) as a public demo.

**Production URL:** `https://plan2026.ca`  
**Privacy policy (for Google OAuth consent screen):** `https://plan2026.ca/privacy`  
**Terms of service (for Google OAuth consent screen):** `https://plan2026.ca/terms`  
**Google OAuth callback:** `https://plan2026.ca/api/auth/callback/google`

---

## Phase 1 — Deploy app changes (code)

- [ ] Merge and deploy the branch that adds `/privacy` and login disclosures.
- [ ] Confirm `/privacy` loads without signing in.

---

## Phase 2 — Vercel environment variables

In **Vercel → plan2026 → Settings → Environment Variables** (Production):

| Variable | Expected value |
|----------|----------------|
| `DATABASE_URL` | Production PostgreSQL connection string |
| `AUTH_SECRET` | Long random string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://plan2026.ca` (no trailing slash) |
| `GOOGLE_CLIENT_ID` | From Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | Same OAuth client |

Optional Facebook Login (see **[GO-LIVE-FACEBOOK.md](./GO-LIVE-FACEBOOK.md)**):

| Variable | Notes |
|----------|--------|
| `AUTH_FACEBOOK_ID` | Meta App ID — set after App Review + Live mode |
| `AUTH_FACEBOOK_SECRET` | Meta App Secret |
| `AUTH_FACEBOOK_ENABLED` | Set to `true` to re-enable after approval (off by default in app) |

After any env change: **Redeploy** Production.

---

## Phase 3 — Production database

From a machine with network access to production Postgres:

```powershell
cd c:\Users\Admin\Desktop\vscode\plan2026
$env:DATABASE_URL = "<production-connection-string>"
pnpm exec prisma migrate deploy
```

- [ ] Migrations applied with no errors.

---

## Phase 4 — Google Cloud Console

Project: the one that owns your OAuth client (`GOOGLE_CLIENT_ID`).

### APIs

- [ ] **Google Calendar API** enabled (required for “Add to Calendar”).

### OAuth client (Web application)

**Authorized JavaScript origins:**

```
https://plan2026.ca
http://localhost:3000
```

**Authorized redirect URIs:**

```
https://plan2026.ca/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### OAuth consent screen

- [ ] App name, support email, and developer contact filled in.
- [ ] **Application home page:** `https://plan2026.ca`
- [ ] **Privacy policy URL:** `https://plan2026.ca/privacy`
- [ ] **Terms of service URL:** `https://plan2026.ca/terms`
- [ ] Scopes include: `openid`, `email`, `profile` (sign-in), and optionally `https://www.googleapis.com/auth/calendar.events` (requested incrementally when the user connects Calendar or uses Add to Calendar).

**Note:** Basic sign-in no longer requests the sensitive `calendar.events` scope, so the unverified-app warning should not appear on login. Calendar connect still requires Google verification (Path B) or test-user mode (Path A) when users grant that scope.

### Publishing (choose one path)

**Path A — Quick demo (Testing mode, limited audience)**

- Leave app in **Testing**.
- Add every demo user’s Google email under **Test users**.
- Good for a controlled demo; **not** suitable for broad advertising.

**Path B — Public live demo (recommended before advertising)**

- Complete Google’s verification checklist for **sensitive scope** (`calendar.events`).
- Move OAuth app to **Production**.
- Anyone with a Google account can sign in.

Google verification can take several days. Start Path B as soon as `/privacy` is deployed.

---

## Phase 5 — End-to-end verification

On `https://plan2026.ca`:

- [ ] Open `/login` — Google button enabled, privacy link works.
- [ ] Sign in with Google — lands on `/tasks` with no error.
- [ ] Create a task, mark done, restore, delete.
- [ ] Optional: **Add to Calendar** on a task with a due date.
- [ ] Sign out and sign in again (session persists).
- [ ] Check Vercel **Functions / Logs** if sign-in fails (common: redirect URI mismatch, wrong `NEXTAUTH_URL`).

---

## Phase 6 — Demo hygiene (recommended)

- [ ] **Facebook:** Follow **[GO-LIVE-FACEBOOK.md](./GO-LIVE-FACEBOOK.md)**. Login is disabled until Meta App Review; then set `AUTH_FACEBOOK_ENABLED=true` in Vercel.
- [ ] Confirm no secrets are committed to git (`.env` stays local).
- [ ] Update `DEPLOY.md` / roadmap when verification is complete.

---

## Common failures

| Symptom | Likely cause |
|---------|----------------|
| Google “redirect_uri_mismatch” | Callback URI not listed in Google Cloud, or typo |
| Sign-in loops back to `/login` | Wrong `NEXTAUTH_URL`, missing `AUTH_SECRET`, or DB/session failure |
| “Access blocked” / 403 from Google | App in Testing mode and user not in test users |
| Calendar button fails | Calendar API off, calendar scope not granted (connect in Settings or via Add to Calendar), or app in Testing mode without test user |

---

## After go-live

When you add a custom domain (TECH-0026), repeat Phase 2 and Phase 4 for the new domain and update `NEXTAUTH_URL`.

**Custom domain live:** Production is **https://plan2026.ca** (2026-06). Keep `plan2026-pi.vercel.app` redirecting to the custom domain in Vercel if the old URL was shared.
