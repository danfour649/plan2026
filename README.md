# Tasks Dashboard (Next.js + Prisma + Google Login)

Interactive task dashboard with:

- Google login (Auth.js / NextAuth)
- Per-user tasks stored in PostgreSQL (Prisma), deployable to Vercel

## Requirements

- Node.js installed (this project was scaffolded with a recent LTS)
- A Google OAuth Client ID/Secret

## Local development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

- `DATABASE_URL` = Postgres connection string (e.g. from [Neon](https://neon.tech) for local dev)
- `AUTH_SECRET` (already generated)
- **Set these**:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

3. Create/upgrade the local Postgres DB (run with `DATABASE_URL` set to your dev Postgres):

```bash
npx prisma migrate dev
```

4. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Google OAuth setup (local)

In Google Cloud Console:

- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

## API

- `GET /api/tasks` → list tasks for current user
- `POST /api/tasks` body: `{ "title": "..." }` → create task
- `PATCH /api/tasks/:id` body: `{ "completed": true|false }` → mark done/restore
- `DELETE /api/tasks/:id` → delete task

## Deploy (Vercel + Postgres)

This project is configured for **PostgreSQL** (schema and migrations). Full step-by-step instructions:

→ **[DEPLOY.md](./DEPLOY.md)** — Vercel account, GitHub import, Postgres (Neon or Vercel Postgres), env vars, Google OAuth, and deploy.

Summary:

1. Sign up at [vercel.com](https://vercel.com) and import your GitHub repo.
2. Create a Postgres database (e.g. [Neon](https://neon.tech) free tier) and add `DATABASE_URL` and other env vars in Vercel.
3. Add your production URL to Google OAuth (origins + redirect URI).
4. Deploy; the build runs `prisma generate`, `prisma migrate deploy`, and `next build`.
