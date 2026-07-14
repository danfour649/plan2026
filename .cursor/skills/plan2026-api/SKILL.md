---
name: plan2026-api
description: >-
  Call the plan2026 HTTP API via the cross-platform @plan2026/cli (apps/cli).
  Use for tasks/plans CRUD against api.plan2026.ca, smoking the API, or when the
  user asks to use the plan2026 API instead of the DB.
---

# plan2026 API CLI

Prefer **`pnpm run cli`** from the plan2026 repo root. Do not hand-roll `curl` unless the CLI lacks the verb.

## Invoke

```powershell
pnpm run cli -- health
pnpm run cli -- tasks list --latest 15
pnpm run cli -- tasks create --title "Follow up"
pnpm run cli -- tasks update <id> --title "Renamed"
pnpm run cli -- tasks complete <id>
pnpm run cli -- tasks delete <id>
pnpm run cli -- plans list --limit 20
pnpm run cli -- plans create --name "Q3" --start-at 2026-07-01 --end-at 2026-09-30
pnpm run cli -- plans delete <id>
```

Use `--` so flags reach the CLI. On PowerShell never use bash `&&` — use `;`.

## Auth and account security

- Token: `PLAN2026_API_TOKEN` in env or repo-root `.env` (gitignored).
- Mint: **Settings → API access**, or `pnpm run api:create-token`.
- Pro: personal tokens may require entitlement.
- **All reads/writes are account-scoped** from the bearer user id. Shared plans: read OK; mutate returns 403 for sharees. Never echo `p26_…` tokens.

## Defaults

| Item | Value |
|------|-------|
| Base URL | `https://api.plan2026.ca` |
| Package | `apps/cli` (`@plan2026/cli`) |
| Docs | `apps/cli/README.md`, `apps/api/RUNBOOK.md` |

## Agent rules

1. Read **powershell** skill for shell syntax on Windows.
2. Prefer table output; `--json` when piping.
3. On `401`/`403`, explain token/Pro/owner constraints — do not invent tokens.
4. Prefer delete only when the user asked; create smoke tasks with clear titles.
