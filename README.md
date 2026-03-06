# Tasks Dashboard (Next.js + Prisma + Google Login)

Interactive task dashboard with:

- Google login (Auth.js / NextAuth)
- Per-user tasks stored in SQLite locally (Prisma)
- Production deployment targeting Vercel + Postgres

## Requirements

- Node.js installed (this project was scaffolded with a recent LTS)
- A Google OAuth Client ID/Secret

## Local development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

- `DATABASE_URL="file:./dev.db"` (already set)
- `AUTH_SECRET` (already generated)
- **Set these**:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

3. Create/upgrade the local SQLite DB:

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

### Important Prisma note (SQLite vs Postgres)

Prisma’s `datasource provider` is defined in `prisma/schema.prisma` and must match your database.
This repo is currently configured for **SQLite** (`provider = "sqlite"`), which is ideal for local dev.

If you want **Postgres in production**, you’ll switch the provider to `postgresql` as part of the deployment prep
and create migrations targeting Postgres.

### 1) Provision Postgres

Create a Postgres database (commonly Neon or Supabase) and copy the connection string.

### 2) Set Vercel environment variables

Set these in Vercel Project Settings → Environment Variables:

- `DATABASE_URL` = Postgres connection string
- `AUTH_SECRET` = same style as local (strong random secret)
- `NEXTAUTH_URL` = `https://<your-app>.vercel.app`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 3) Switch Prisma schema to Postgres (one-time)

In `prisma/schema.prisma`:

- Change `provider = "sqlite"` → `provider = "postgresql"`
- Keep `url = env("DATABASE_URL")`

Then generate a new migration against Postgres:

```bash
npx prisma migrate dev --name init_postgres
```

(If you already have local SQLite migrations, keep them for local dev, but don’t apply them to Postgres.)

### 3) Google OAuth setup (production)

- **Authorized JavaScript origins**: `https://<your-app>.vercel.app`
- **Authorized redirect URIs**: `https://<your-app>.vercel.app/api/auth/callback/google`

### 4) Run migrations in production

On deploy, run Prisma migrations against Postgres:

```bash
npx prisma migrate deploy
```

(How you run this depends on your deployment workflow; it can be done in CI before deploy, or as part of a build/deploy step.)
