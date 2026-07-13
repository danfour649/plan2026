---
name: plan2026-api
description: >-
  Call the plan2026 HTTP API via the cross-platform @plan2026/cli (apps/cli).
  Use when listing or inspecting tasks/plans through api.plan2026.ca, smoking
  the API, or when the user asks to use the plan2026 API instead of the DB.
---

# plan2026 API CLI

Prefer **`pnpm run cli`** from the plan2026 repo root. Do not hand-roll `curl` unless the CLI lacks the verb you need.

## Invoke (Windows PowerShell and Unix)

```powershell
pnpm run cli -- health
pnpm run cli -- tasks list --latest 15
pnpm run cli -- tasks list --status active --json
pnpm run cli -- plans list --limit 20
```

Use `--` so flags reach the CLI. On PowerShell never use bash `&&` — use `;`.

## Auth

- Token: `PLAN2026_API_TOKEN` in env or repo-root `.env` (gitignored).
- Mint: app **Settings → API access**, or `pnpm run api:create-token`.
- Pro: bearer personal tokens may require an active Pro entitlement (fail-closed without `REVENUECAT_SECRET_API_KEY` on the API).
- **Never** echo, commit, or paste the raw `p26_…` token into chat, commits, or PR bodies.

## Defaults

| Item | Value |
|------|-------|
| Base URL | `https://api.plan2026.ca` (override `PLAN2026_API_URL` or `--base-url`) |
| Package | `apps/cli` (`@plan2026/cli`) |
| Docs | `apps/cli/README.md`, `apps/api/RUNBOOK.md` |

## When CLI is wrong tool

| Need | Use instead |
|------|-------------|
| Mint DB token without HTTP | `pnpm run api:create-token` |
| Deploy / env on Vercel | **vercel-cli** skill + `plan2026-api` project |
| Edit tasks in Postgres directly | Prisma / app UI — not this CLI |

## Agent rules

1. Read **powershell** skill for shell syntax on Windows.
2. Prefer table output for humans; `--json` when piping or transforming.
3. On `401`, tell the user the token may be missing/invalid or Pro-gated — do not invent a new token without asking.
