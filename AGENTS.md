# Agent Instructions

Canonical agent guidance lives in **[danf-skills](https://github.com/danfour649/danf-skills)** — install skills with `scripts/link-skills.ps1` from that repo (or use existing junctions in `~/.cursor/skills/`).

## Skills for this repo

| Skill | Use for |
|-------|---------|
| **powershell** | All shell commands on Windows |
| **create-pr** | Branches, changesets, `gh` PR workflow, babysit |
| **bulk-task-pr** | Exported plan/task JSON → one PR per task |

## plan2026-specific rules

Read danf-skills overlays (same content, local path if cloned):

- `overlays/plan2026/agent-instructions/PROJECT.md` — i18n, Next.js cache, typecheck, docs
- `overlays/plan2026/create-pr/PROJECT.md` — `"plan2026"` changesets, prepush, `pnpm run pr`
- `overlays/plan2026/bulk-task-pr/PROJECT.md` — roadmap paths, `bulk:next`, PostgreSQL null sort

Or from a danf-skills clone: `../danf-skills/overlays/plan2026/`

## Quick reference

- **Changeset package name:** `"plan2026"`
- **Do not** run `pnpm run changeset:version` on feature branches — CI on `main` consumes changesets
- **Never leave a pushed branch without a PR** unless the user asked not to
- **After merge (mandatory):** immediately sync local `main` — `git fetch origin`, stash if checkout is blocked, `git checkout main`, `git pull origin main`. Do not wait for the user to ask. See **create-pr** skill §10.

Full generic rules: [danf-skills/AGENTS.md](https://github.com/danfour649/danf-skills/blob/main/AGENTS.md)
