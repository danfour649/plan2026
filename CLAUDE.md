@C:\Users\Admin\Desktop\vscode\danf-skills\AGENTS.md

## Skills — always invoke, never improvise

**MANDATORY:** When a skill exists for an operation, invoke it via the Skill tool BEFORE generating any other response. Do not hand-roll PRs, shell commands, Vercel env, or Google OAuth setup.

| Operation | Skill |
|-----------|-------|
| Any shell command on Windows | `powershell` |
| Open / update / merge a PR | `create-pr` |
| Open PRs across GitHub | `list-open-prs` |
| Bulk tasks → PRs | `bulk-task-pr` |
| Vercel env / deploys / domains | `vercel-cli` |
| gcloud project / APIs / OAuth limits | `gcp-cli` |

## plan2026 overlays

Read danf-skills overlays (local clone: `../danf-skills/overlays/plan2026/`):

- `agent-instructions/PROJECT.md` — i18n, Next.js cache, typecheck
- `create-pr/PROJECT.md` — `"plan2026"` changesets, prepush
- `bulk-task-pr/PROJECT.md` — roadmap, `bulk:next`
- `vercel-cli/PROJECT.md` — production URL, auth env vars
- `gcp-cli/PROJECT.md` — Google OAuth redirect URIs

Repo-specific quick reference (including Cursor Cloud): see `AGENTS.md` in this repo.
