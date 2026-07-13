# @plan2026/cli

Cross-platform Node CLI for the plan2026 HTTP API (`https://api.plan2026.ca`).

Works on Windows, macOS, and Linux (Node ≥ 20). No shell-specific scripts required.

## Setup

From the plan2026 repo root:

```bash
pnpm install
```

Auth: set `PLAN2026_API_TOKEN` in the environment or in the repo-root `.env` (mint in **Settings → API access**, or `pnpm run api:create-token`). Personal tokens require Pro when server entitlement checks are enabled.

Optional:

| Variable | Default |
|----------|---------|
| `PLAN2026_API_URL` | `https://api.plan2026.ca` |
| `PLAN2026_API_TOKEN` | _(required for `/tasks` and `/plans`)_ |

## Usage

From the repo root (recommended):

```bash
pnpm run cli -- health
pnpm run cli -- tasks list --latest 15
pnpm run cli -- tasks list --status active --json
pnpm run cli -- plans list --limit 20
pnpm run cli -- plans list --show-archived --page 1
```

Package bin (after `pnpm install`):

```bash
pnpm --filter @plan2026/cli exec plan2026-api health
```

Global flags:

| Flag | Meaning |
|------|---------|
| `--base-url <url>` | Override API host |
| `--token <token>` | Override bearer token (prefer env / `.env`) |
| `--json` | Raw JSON stdout |
| `-h` / `--help` | Usage |

Never commit tokens. Do not print bearer values in logs or PR bodies.

## Related

- API package: [`apps/api`](../api/)
- Runbook: [`apps/api/RUNBOOK.md`](../api/RUNBOOK.md)
- OpenAPI: `GET /openapi.json` on the API host
