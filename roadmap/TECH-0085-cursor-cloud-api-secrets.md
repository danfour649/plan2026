# TECH-0085: Populate Cursor Cloud Agent secrets for API smoke tests

**Status:** Not done — ops + docs checklist for Cloud Agents.

**Goal:** Make future Cursor Cloud Agent runs able to exercise authenticated production API checks (`https://api.plan2026.ca` / `https://plan2026-api.vercel.app`) without minting tokens against the local VM database only.

**Why:** Cloud Agents currently inject `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` only. Smoke tests that need a personal `p26_…` bearer token (or other API keys) fail against production because local `.env` tokens are not in production Postgres.

**Estimated effort:** Small — dashboard secrets + short `AGENTS.md` / runbook notes. No app code required unless an update script should mirror secrets into `.env`.

---

## Context

- Production API hosts: `https://api.plan2026.ca`, alias `https://plan2026-api.vercel.app`.
- Auth: `Authorization: Bearer p26_…` (Settings → API access, or `pnpm run api:create-token`).
- Runbook smoke tests: [apps/api/RUNBOOK.md](../apps/api/RUNBOOK.md) (expect `PLAN2026_API_TOKEN` for bearer `GET /tasks` and `GET /plans`).
- Cloud environment (personal): [plan2026 Cloud Agents environment](https://cursor.com/dashboard/cloud-agents/environments/r/github.com/danfour649/plan2026).
- Cursor docs: [Cloud Environment Setup](https://cursor.com/docs/cloud-agent/setup), [Secret types](https://cursor.com/docs/cloud-agent/security-network).

---

## Recommended secrets

Add on the Cloud Agents environment **Secrets** tab. Prefer **Runtime Secret** for tokens.

| Variable | Type | Notes |
|----------|------|--------|
| `PLAN2026_API_TOKEN` | Runtime Secret | Production personal API token for `danfour@gmail.com` (or a dedicated smoke user). Create in Settings → API access; store once. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Already injected | Keep as-is. |
| `VERCEL_TOKEN` | Runtime Secret (optional) | Only if agents should `vercel env pull` / deploy. |
| `DATABASE_URL` | Prefer local VM string | Local `postgresql://plan2026:plan2026@localhost:5432/plan2026` is enough for app/dev. Avoid putting production Postgres in Cloud Agents unless intentionally needed (high risk). |

After adding secrets, start a **new** Cloud Agent run so they inject.

---

## Docs / setup follow-through

| Step | Description |
|------|-------------|
| 1 | Add `PLAN2026_API_TOKEN` (and any optional keys) in the Cloud Agents Secrets tab. |
| 2 | Update **Cursor Cloud specific instructions** in [AGENTS.md](../AGENTS.md): document that `PLAN2026_API_TOKEN` is injected for production API smoke tests; if missing, agents should only run unauthenticated checks or local `api:dev` smoke. |
| 3 | Optionally extend the environment update/install script to mirror injected secrets into gitignored `.env` (`PLAN2026_API_TOKEN=…`) so runbook curls that read `.env` work without manual export. |
| 4 | Optionally note `api.plan2026.ca` alongside the Vercel alias in the runbook smoke section (both are live). |
| 5 | Verify with a new agent: `test -n "$PLAN2026_API_TOKEN"` and bearer `GET https://api.plan2026.ca/tasks` returns 200 with a `tasks` array. |

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | [ ] Add `PLAN2026_API_TOKEN` as a Runtime Secret on the plan2026 Cloud Agents environment |
| 2 | [ ] Start a new Cloud Agent and confirm the secret is present (length check; do not print the value into chat) |
| 3 | [ ] Document the secret in `AGENTS.md` Cursor Cloud section |
| 4 | [ ] (Optional) Mirror secret into `.env` from the update script |
| 5 | [ ] (Optional) Mention `api.plan2026.ca` in runbook smoke examples |
| 6 | [ ] Authenticated production smoke: `GET /tasks` and `GET /plans` with bearer return 200 |

---

## Out of scope

- Changing API auth or CORS.
- Committing tokens or production `DATABASE_URL` to the repo or snapshots.
- Replacing Settings / `api:create-token` as the way humans mint tokens.
