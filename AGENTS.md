# Agent Instructions

Canonical agent guidance lives in **[danf-skills](https://github.com/danfour649/danf-skills)** — install skills with `scripts/link-skills.ps1` from that repo (or use existing junctions in `~/.cursor/skills/`).

## Skills for this repo

| Skill | Use for |
|-------|---------|
| **powershell** | All shell commands on Windows |
| **create-pr** | Branches, changesets, `gh` PR workflow, babysit |
| **bulk-task-pr** | Exported plan/task JSON → one PR per task |
| **vercel-cli** | Vercel env vars, deploys, `NEXTAUTH_URL`, domains |
| **gcp-cli** | gcloud APIs/project; Google OAuth console (not redirect URI CLI) |
| **list-open-prs** | One-shot open PR list across GitHub repos |
| **plan2026-api** | HTTP API via `apps/cli` (`pnpm run cli -- …`) — see `.cursor/skills/plan2026-api/` |

## plan2026-specific rules

Read danf-skills overlays (same content, local path if cloned):

- `overlays/plan2026/agent-instructions/PROJECT.md` — i18n, Next.js cache, typecheck, docs
- `overlays/plan2026/create-pr/PROJECT.md` — `"plan2026"` changesets, prepush, `pnpm run pr`
- `overlays/plan2026/bulk-task-pr/PROJECT.md` — roadmap paths, `bulk:next`, PostgreSQL null sort
- `overlays/plan2026/vercel-cli/PROJECT.md` — plan2026 Vercel project, production URL, auth env vars
- `overlays/plan2026/gcp-cli/PROJECT.md` — Google OAuth redirect URIs, Calendar API

Or from a danf-skills clone: `../danf-skills/overlays/plan2026/`

## Quick reference

- **Changeset package name:** `"plan2026"`
- **Do not** run `pnpm run changeset:version` on feature branches — CI on `main` consumes changesets
- **Never leave a pushed branch without a PR** unless the user asked not to
- **After merge (mandatory):** immediately sync local `main` — `git fetch origin`, stash if checkout is blocked, `git checkout main`, `git pull origin main`. Do not wait for the user to ask. See **create-pr** skill §10.

Full generic rules: [danf-skills/AGENTS.md](https://github.com/danfour649/danf-skills/blob/main/AGENTS.md)

## Cursor Cloud specific instructions

Single Next.js 16 app (App Router) backed by **PostgreSQL via Prisma**. Standard commands live in `package.json` (`dev`, `lint`, `typecheck`, `test`, `build`) and `README.md`.

- **PostgreSQL is required and is NOT auto-started on boot.** Start it before running the app/tests: `sudo pg_ctlcluster 16 main start`. A local DB `plan2026` (role `plan2026` / password `plan2026`) already exists with all migrations applied, and a gitignored `.env` holds `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL`.
- After pulling new migrations, apply them with `pnpm exec prisma migrate deploy` (the update script intentionally does not run migrations).
- Run the app with `pnpm run dev` (port 3000, webpack). Lint/test/typecheck: see `package.json` scripts.
- **Auth is Google OAuth.** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are provided as injected secrets (also mirrored into the gitignored `.env`), so the "Continue with Google" button is enabled and the OAuth redirect works. Completing a real Google login still requires a Google account in the browser. To exercise authenticated flows (`/tasks`, `/plans`, etc.) WITHOUT a real Google login, seed a DB user + session: `pnpm exec tsx -r dotenv/config scripts/seed-dev-session.ts`. It prints a `SESSION_TOKEN`; set it in the browser as cookie `next-auth.session-token` (e.g. DevTools console: `document.cookie = "next-auth.session-token=<token>; path=/"`), then load `/tasks`.
- **Gotcha:** sessions are cached per-token with `cacheLife("max")` (`src/auth.ts`). A user with `null` `preferredLocale`/`preferredTheme` triggers a "revalidateTag during render" error on first authenticated render. The seed script sets those prefs to avoid it; if you change a user's prefs, use a fresh session token (new cache key) or restart the dev server to clear the in-process cache.
