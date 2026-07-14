# plan2026 standalone API (`@plan2026/api`)

OpenAPI-first HTTP API for plan2026, deployed as a **second Vercel project** from this repo (`apps/api`). It uses the same PostgreSQL database as the web app (`DATABASE_URL`).

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/openapi.json` | No | OpenAPI 3.0 spec |
| `GET` | `/docs` | No | Swagger UI |
| `GET` | `/tasks` | Bearer | List tasks **owned by this account** |
| `POST` | `/tasks` | Bearer | Create task (owner) |
| `GET` | `/tasks/{id}` | Bearer | Get owned task |
| `PATCH` | `/tasks/{id}` | Bearer | Update owned task |
| `DELETE` | `/tasks/{id}` | Bearer | Delete owned task |
| `POST` | `/tasks/{id}/complete` | Bearer | Mark done (owner) |
| `POST` | `/tasks/{id}/restore` | Bearer | Restore completed (owner) |
| `GET` | `/plans` | Bearer | List plans (owned + shared) |
| `POST` | `/plans` | Bearer | Create plan (owner) |
| `GET` | `/plans/{id}` | Bearer | Get plan (owner or sharee) |
| `PATCH` | `/plans/{id}` | Bearer | Update plan (**owner only**) |
| `DELETE` | `/plans/{id}` | Bearer | Delete plan (**owner only**; `?deleteTasks=1`) |

Account security: every query/mutation is scoped by the authenticated `userId`. Cross-account IDs return **404** (not found). Sharees may read shared plans but receive **403** on mutate/delete.

## Authentication

Send a bearer token on every protected request:

```http
Authorization: Bearer p26_…
```

Token types:

1. **Personal API token** (recommended) — prefix `p26_`. Users create and revoke their own tokens in the web app under **Settings → API access** (the raw token is shown once). Admins can also mint one from a machine with `DATABASE_URL`:

   ```bash
   pnpm run api:create-token -- you@example.com "My CLI"
   ```

2. **NextAuth session token** — for development; see `scripts/seed-dev-session.ts`.

## Local development

From the repo root (requires `DATABASE_URL` in `.env` or the environment):

```bash
pnpm run api:dev
```

This bundles shared plan2026 modules with esbuild (so `@/*` imports resolve), then starts the server on port **3001** with watch mode.

One-off build:

```bash
pnpm --filter @plan2026/api run build
DATABASE_URL=… node apps/api/dist/dev-server.js
```

## Shared code

This package imports plan2026 core modules via TypeScript path aliases (`@/*` → `../../src/*`):

- `src/lib/prisma.ts`
- `src/lib/validations/*`
- `src/lib/task-service.ts`
- `src/lib/api-auth.ts`
- `src/lib/rate-limit.ts`

Run `pnpm exec prisma generate` from the repo root after schema changes.

## Deploy on Vercel (second project)

See **[RUNBOOK.md](./RUNBOOK.md)** for day-to-day operations, and **[DEPLOY.md](../../DEPLOY.md)** § “Standalone API”.

Summary:

1. Create a new Vercel project from the same GitHub repo.
2. Set **Root Directory** to `apps/api`.
3. Copy production env vars (`DATABASE_URL`, `NODEJS_HELPERS=0`, optional `BLOB_READ_WRITE_TOKEN`).
4. Deploy (build writes `.vercel/output` via Build Output API).
5. Assign a domain such as `api.plan2026.ca` when ready.

The web app at `plan2026.ca` can keep using server actions and `/api/*`. Point integrations at the standalone API when you want OpenAPI and bearer tokens.
