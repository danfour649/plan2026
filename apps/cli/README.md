# @plan2026/cli

Cross-platform Node CLI for the plan2026 HTTP API (`https://api.plan2026.ca`).

Works on Windows, macOS, and Linux (Node ≥ 20).

## Setup

```bash
pnpm install
```

Auth: `PLAN2026_API_TOKEN` in the environment or repo-root `.env` (Settings → API access). Personal tokens may require Pro.

| Variable | Default |
|----------|---------|
| `PLAN2026_API_URL` | `https://api.plan2026.ca` |
| `PLAN2026_API_TOKEN` | _(required for authenticated routes)_ |

## Commands

```bash
pnpm run cli -- health
pnpm run cli -- tasks list --latest 15
pnpm run cli -- tasks get <id>
pnpm run cli -- tasks create --title "Ship it" --urgency 5
pnpm run cli -- tasks update <id> --title "Renamed" --clear-plan
pnpm run cli -- tasks complete <id>
pnpm run cli -- tasks restore <id>
pnpm run cli -- tasks delete <id>
pnpm run cli -- plans list --limit 20
pnpm run cli -- plans get <id>
pnpm run cli -- plans create --name "Q3" --start-at 2026-07-01 --end-at 2026-09-30
pnpm run cli -- plans update <id> --name "Q3" --start-at 2026-07-01 --end-at 2026-09-30 --status started
pnpm run cli -- plans delete <id> [--delete-tasks]
```

All mutating calls are limited to the **token account**. Shared plans are readable; only owners can update/delete. Tasks are never shared across accounts via the API.

Never commit or print bearer tokens.

## Related

- API: [`apps/api`](../api/) · OpenAPI: `/openapi.json` · Runbook: [`apps/api/RUNBOOK.md`](../api/RUNBOOK.md)
- Skill: [`.cursor/skills/plan2026-api/SKILL.md`](../../.cursor/skills/plan2026-api/SKILL.md)
