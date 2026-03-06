# Deploy plan2026 to Vercel

This repo is set up for **PostgreSQL** (required by Vercel). Follow these steps to deploy.

---

## 1. Create a Vercel account and connect GitHub

1. Go to [vercel.com](https://vercel.com) and sign up (e.g. **Continue with GitHub**).
2. After signing in, go to **Dashboard** → **Add New** → **Project**.
3. **Import** your GitHub repo (`plan2026`). Grant Vercel access to the repo if asked.
4. Leave **Framework Preset** as Next.js and **Root Directory** as `.`. Do **not** deploy yet—you need env vars and a database first.

---

## 2. Create a Postgres database

You need a Postgres connection string for production. Two simple options:

- **[Neon](https://neon.tech)** (free tier): Sign up → Create a project → copy the connection string (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
- **[Vercel Postgres](https://vercel.com/storage/postgres)** (if available in your plan): Create a Postgres store in the Vercel dashboard and copy the `POSTGRES_URL` (or `DATABASE_URL`) it gives you.

Save this URL; you’ll add it as `DATABASE_URL` on Vercel.

---

## 3. Set environment variables on Vercel

In your Vercel project: **Settings** → **Environment Variables**. Add these for **Production** (and optionally Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Postgres connection string (from step 2) |
| `AUTH_SECRET` | A long random string (e.g. run `openssl rand -base64 32` and paste the result) |
| `NEXTAUTH_URL` | `https://<your-project-name>.vercel.app` (replace with your actual Vercel URL; you can set it after first deploy) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID (same as local or a separate “production” client) |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |

**Note:** After the first deploy, Vercel will show your live URL. If you didn’t set `NEXTAUTH_URL` yet, set it then to `https://<that-url>` and redeploy.

---

## 4. Add production URLs to Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 Client:

1. **Authorized JavaScript origins:** add  
   `https://<your-project-name>.vercel.app`
2. **Authorized redirect URIs:** add  
   `https://<your-project-name>.vercel.app/api/auth/callback/google`

Save. Use your real Vercel URL (e.g. `https://plan2026.vercel.app`).

---

## 5. Deploy

1. In Vercel, click **Deploy** (or push to the connected branch to trigger a new deploy).
2. The build runs: `prisma generate` → `prisma migrate deploy` → `next build`. Migrations run against the Postgres DB you set in `DATABASE_URL`.
3. When the deploy finishes, open **https://&lt;your-project-name&gt;.vercel.app**. You should be redirected to login; use **Continue with Google** to sign in and use the task dashboard.

---

## 6. Local development after switching to Postgres

The app now uses **PostgreSQL** only (schema and migrations). For local dev:

1. Create a second Postgres database (e.g. another Neon project or branch) for development.
2. In `.env`, set  
   `DATABASE_URL="<your-dev-postgres-url>"`
3. Run migrations:  
   `npx prisma migrate dev`  
   (only if you added new migrations)
4. Start the app:  
   `npm run dev`

Using a separate dev Postgres DB keeps production data safe and avoids SQLite/Postgres differences.
