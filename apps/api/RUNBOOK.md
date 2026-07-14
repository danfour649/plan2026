# plan2026 API runbook

Operational guide for the standalone OpenAPI API (`apps/api`), Vercel project **`plan2026-api`**.

Canonical production host today: **https://plan2026-api.vercel.app**  
(Optional custom domain later: `https://api.plan2026.ca` — see DEPLOY.md.)

Related: [README.md](./README.md), [DEPLOY.md](../../DEPLOY.md) §9, Settings → API access in the web app.

---

## Architecture (short)

| Piece | Detail |
|-------|--------|
| Code | Hono + `@hono/zod-openapi` in `apps/api` |
| Data | Same Postgres as the web app (`DATABASE_URL`) |
| Auth | `Authorization: Bearer p26_…` (Settings UI or `pnpm run api:create-token`) |
| Deploy | Second Vercel project, **Root Directory** = `apps/api` |
| Build | `build.mjs` bundles app code, runs `npm install` into `.vercel/output/functions/api.func`, and emits **Vercel Build Output API** (required for reliable Git deploys; do not rely on gitignored `api/index.js` alone) |

Public routes: `GET /health`, `GET /docs`, `GET /openapi.json`  
Protected: `GET|POST /tasks`, `GET /plans`

---

## Environment (Vercel project `plan2026-api`)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Same production Postgres as `plan2026` |
| `NODEJS_HELPERS` | Recommended | Set to `0` (Node request helpers off; Hono node adapter) |
| `BLOB_READ_WRITE_TOKEN` | Optional | Only if attachment routes use Blob |

After any env change: **redeploy** production.

Copy from the web project:

```powershell
cd c:\Users\Admin\Desktop\vscode\plan2026
vercel link --yes --project plan2026
vercel env pull .env.vercel-check --environment=production --yes
vercel link --yes --project plan2026-api
# Then vercel env add DATABASE_URL production --value … --sensitive --yes
Remove-Item .env.vercel-check
```

---

## Deploy

### Automatic (preferred)

Push/merge to `main` → Vercel Git integration builds `plan2026-api` (root `apps/api`).

Confirm:

1. Vercel → **plan2026-api** → Deployments → latest **Production** is Ready  
2. Smoke tests below against `https://plan2026-api.vercel.app`

### Manual CLI (when Git deploy misbehaves)

From the **repo root** (project must be linked to `plan2026-api`):

```powershell
cd c:\Users\Admin\Desktop\vscode\plan2026
vercel link --yes --project plan2026-api
vercel deploy --prod --yes
```

Then re-link the web app for day-to-day work:

```powershell
vercel link --yes --project plan2026
```

### First-time project setup

1. Vercel → Add New Project → same `plan2026` GitHub repo  
2. **Root Directory:** `apps/api`  
3. Framework: Other (config from `apps/api/vercel.json`)  
4. Set env vars (table above)  
5. Deploy; apply migrations once on the shared DB (`pnpm exec prisma migrate deploy` with production `DATABASE_URL`)

---

## Database

Migrations live in the monorepo `prisma/` folder (shared with the web app).

```powershell
# Uses DATABASE_URL from .env — point at production only when intentional
pnpm exec prisma migrate deploy
```

`ApiToken` and all app tables must exist before bearer tokens or `/tasks` work.

---

## Tokens

**Preferred:** Web app → **Settings → API access** → create token (shown once).

**CLI:**

```powershell
pnpm exec tsx scripts/create-api-token.ts you@example.com "laptop"
```

Local smoke token (gitignored): `PLAN2026_API_TOKEN` in `.env`.

**HTTP client CLI** (cross-platform, `apps/cli`):

```powershell
pnpm run cli -- health
pnpm run cli -- tasks list --latest 15
pnpm run cli -- tasks create --title "Smoke create"
pnpm run cli -- plans list --limit 10
```

See [`apps/cli/README.md`](../cli/README.md) for full CRUD.

---

## Smoke tests

```powershell
# Load .env into the session if needed, then:
curl.exe -sS "https://plan2026-api.vercel.app/health"
# expect: {"ok":true,"service":"plan2026-api"}

curl.exe -sS -o NUL -w "%{http_code}`n" "https://plan2026-api.vercel.app/docs"
# expect: 200

curl.exe -sS "https://plan2026-api.vercel.app/tasks"
# expect: 401 {"error":"Unauthorized"}

curl.exe -sS -H "Authorization: Bearer $env:PLAN2026_API_TOKEN" "https://plan2026-api.vercel.app/tasks"
# expect: 200 JSON with a "tasks" array

curl.exe -sS -H "Authorization: Bearer $env:PLAN2026_API_TOKEN" "https://plan2026-api.vercel.app/plans"
# expect: 200 JSON with plans
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Alias `plan2026-api.vercel.app` → **404 NOT_FOUND** after a Git deploy | Old builds wrote only static `public/` and dropped the serverless function | Ensure `build.mjs` writes `.vercel/output` (Build Output API). Redeploy. Do **not** rely on gitignored `api/index.js` alone. |
| Deployment URL → **302** to `vercel.com/sso-api` | Deployment Protection on preview/deployment URLs | Use the production alias, or disable Protection for Production in project settings |
| `FUNCTION_INVOCATION_FAILED` / `headers.get is not a function` | Wrong adapter (`hono/vercel` on Node) | Entry must use `@hono/node-server/vercel`; `NODEJS_HELPERS=0` |
| `DATABASE_URL is not set` / DB errors | Missing env on `plan2026-api` | Copy `DATABASE_URL` from `plan2026`; redeploy |
| `ApiToken` / table missing | Migration not applied on production | `pnpm exec prisma migrate deploy` with prod URL |
| `/docs` returns **401** | Bearer middleware mounted on `/*` | Auth must be scoped to `/tasks` and `/plans` only |
| CLI deploy works, Git deploy does not | Classic Vercel + generated `api/` mismatch | Build Output API path above; compare Deployments → Output |

Inspect / logs:

```powershell
vercel link --yes --project plan2026-api
vercel ls --prod
vercel inspect <deployment-url> --logs
vercel logs <deployment-url>
```

---

## Local development

```powershell
# From repo root, with DATABASE_URL in .env
pnpm run api:dev
# http://localhost:3001/health
```

---

## Checklist after merging API changes

- [ ] GitHub `main` Build workflow green  
- [ ] Vercel **plan2026-api** Production deployment Ready  
- [ ] `GET /health` on the production alias returns 200  
- [ ] Bearer `GET /tasks` returns 200  
- [ ] If schema changed: `prisma migrate deploy` on production  
- [ ] Relink local CLI to `plan2026` if you linked `plan2026-api` for deploys  
