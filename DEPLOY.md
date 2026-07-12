# Deploy `plan2026` to Vercel

This app uses Next.js, Prisma, PostgreSQL, Google OAuth, and Google Calendar integration. Follow these steps to deploy it safely.

---

## 1. Create a Vercel project

1. Sign in at [vercel.com](https://vercel.com).
2. Import the `plan2026` repository.
3. Keep the framework preset as `Next.js`.
4. Do not deploy yet; set up the database and env vars first.

---

## 2. Create PostgreSQL databases

This app is Postgres-only in every environment. You should use:

- one PostgreSQL database for local development and testing
- one PostgreSQL database for production

Common hosted production choices:

- [Neon](https://neon.tech)
- [Vercel Postgres](https://vercel.com/storage/postgres)

Copy the production connection string and use it as `DATABASE_URL` in Vercel. Keep your local `.env` pointed at a separate Postgres database so local work and deployed behavior stay aligned without sharing data.

---

## 3. Add environment variables in Vercel

In Vercel, open **Project Settings** -> **Environment Variables** and add these for `Production`:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Production PostgreSQL connection string |
| `AUTH_SECRET` | A long random secret |
| `NEXTAUTH_URL` | Your production app URL, for example `https://plan2026.ca` |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AUTH_FACEBOOK_ID` | (optional) Meta App ID for Facebook Login |
| `AUTH_FACEBOOK_SECRET` | (optional) Meta App Secret |
| `AUTH_FACEBOOK_ENABLED` | (optional) Set to `true` after Meta App Review to show Facebook login |

Notes:

- `NEXTAUTH_URL` is also used to build the Google OAuth callback URL for Calendar event creation.
- If your final Vercel URL changes after the first deploy, update `NEXTAUTH_URL` and redeploy.

For step-by-step launch checklists, see **[GO-LIVE.md](./GO-LIVE.md)** (Google) and **[GO-LIVE-FACEBOOK.md](./GO-LIVE-FACEBOOK.md)** (Facebook Login).

---

## 4. Configure Google Cloud

In Google Cloud Console:

1. Enable the **Google Calendar API** for the project.
2. Open your OAuth 2.0 client credentials.
3. Add your production JavaScript origin:
   - `https://plan2026.ca`
4. Add your production redirect URI:
   - `https://plan2026.ca/api/auth/callback/google`
5. On the OAuth consent screen, set the **privacy policy URL** to:
   - `https://plan2026.ca/privacy`

The app requests these Google scopes:

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar.events`

If users signed in before the Calendar scope was added, they may need to sign out and sign in again before `Add to Calendar` works.

---

## 5. Deploy

1. Trigger the first deploy in Vercel.
2. The app build runs:
   - `prisma generate`
   - `next build`
3. Apply migrations against production:

```bash
pnpm exec prisma migrate deploy
```

If you use Vercel build commands or CI automation, make sure `prisma migrate deploy` runs before the app starts serving traffic.

---

## 6. Verify production

After deployment:

1. Open the production URL.
2. Sign in with Google.
3. Create a task with:
   - a title
   - optional notes
   - optional due date
4. Mark it done, restore it, and delete it.
5. Test `Add to Calendar` and confirm the event appears in Google Calendar.

---

## 7. Local development and production parity

This project is Postgres-only. For local development:

1. Use a separate development Postgres database.
2. Set that database URL in local `.env`.
3. Run:

```bash
pnpm exec prisma migrate dev
pnpm run dev
```

Keeping development and production on PostgreSQL avoids environment drift.

---

## 8. Secret rotation

### AUTH_SECRET

- Generate a new value (e.g. `openssl rand -base64 32` or a long random string).
- Set the new value in Vercel (or your host) as `AUTH_SECRET` and redeploy.
- Existing sessions may be invalidated; users will need to sign in again.

### Google OAuth credentials

- In Google Cloud Console, create a new OAuth 2.0 client (or rotate the client secret if your provider supports it).
- Update `GOOGLE_CLIENT_ID` and/or `GOOGLE_CLIENT_SECRET` in your environment and redeploy.
- Users who signed in with the old client may need to sign out and sign in again to re-authorize.

---

## 9. Standalone API (second Vercel project)

The repo includes an OpenAPI-first HTTP API in **`apps/api`**. It shares the production PostgreSQL database with the web app but deploys as its own Vercel project (production alias: `https://plan2026-api.vercel.app`; optional custom domain `https://api.plan2026.ca`).

**Operations:** see **[apps/api/RUNBOOK.md](./apps/api/RUNBOOK.md)** (env vars, Git vs CLI deploy, smoke tests, troubleshooting).

### Create the API project

1. In Vercel, **Add New Project** and import the same `plan2026` GitHub repository again.
2. Set **Root Directory** to `apps/api`.
3. Framework preset can remain **Other** (see `apps/api/vercel.json` — build emits `.vercel/output`).
4. Add environment variables:

| Name | Value |
|------|-------|
| `DATABASE_URL` | Same production PostgreSQL connection string as the web app |
| `NODEJS_HELPERS` | `0` (recommended) |

Optional: `BLOB_READ_WRITE_TOKEN` if you add attachment routes to the standalone API later.

5. Deploy. The build runs `prisma generate` from the repo root and writes the serverless function via the Build Output API.
6. Apply migrations once against production (same as §5) — the `ApiToken` table and all other schema live in the shared database.

### API authentication

Protected routes require:

```http
Authorization: Bearer <token>
```

Users create their own tokens in the web app under **Settings → API access** — the raw `p26_…` token is shown once, and tokens can be revoked from the same screen.

Alternatively, mint a token from a machine with `DATABASE_URL`:

```bash
pnpm exec tsx scripts/create-api-token.ts you@example.com "Production CLI"
```

Store the printed `p26_…` token securely. It is shown only once.

### Verify the API

1. Open `https://plan2026-api.vercel.app/health` — expect `{ "ok": true, "service": "plan2026-api" }`.
2. Open `https://plan2026-api.vercel.app/docs` for Swagger UI.
3. Call `GET /tasks` with the bearer token.

The web app at `plan2026.ca` continues to use server actions and its own `/api/*` routes. You can adopt the standalone API in the UI later; see `apps/api/README.md`.

