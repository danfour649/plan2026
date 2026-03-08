# TECH-0048: Share to social media / external plans

**Status:** Not implemented — implementation notes for future work.

**Goal:** Allow sharing a plan or task via a link that can be posted on social media or sent externally. The link should open a **public view** page where the recipient (even if not signed in) can see the plan/task in read-only form and, in a limited way, update task status (e.g. mark done). The endpoint for unauthenticated status updates must be secured (e.g. token-based). Optionally allow the recipient to add their email or sign up. Only plans/tasks that the owner has explicitly made “shareable” or “public” should be accessible.

---

## What is needed

### 1. Scope

| Feature | Description |
|---------|-------------|
| **Public view** | A URL (e.g. `/share/[token]` or `/p/[token]`) that shows plan/task details in read-only form. No login required. |
| **Limited write** | Authenticated by a secret token in the URL: allow changing task status only (e.g. mark done / restore). No edit of title, dates, or other fields. |
| **Access control** | Only plans/tasks the owner has “published” or “shared by link” are reachable; token must be unguessable (e.g. long random or CUID). |
| **Optional sign-up** | On the public page, offer “Add your email” or “Sign up to get updates” and/or “Sign in to add this to your account”. |

### 2. Data model

- **Share link / token:** You need a way to generate and store a share token per plan (or per task). Options:
  - **PlanShare** (or **PlanLink**): `planId`, `token` (unique), `expiresAt?`, `createdAt`. Optional: `allowStatusUpdate` boolean.
  - If you support task-level share: **TaskShare** with `taskId`, `token`, etc.
- **Public access:** Resolve token → plan (and tasks) or task; if expired or not found, return 404 or “Link expired”. Enforce that only the owner can create/revoke share links.

### 3. Security

| Risk | Mitigation |
|------|-------------|
| **Token guessing** | Use a long, cryptographically random token (e.g. 32 bytes hex or CUID). Store in DB; look up by token. |
| **Unauthorized status change** | Accept status updates only for requests that include the valid token (e.g. in body or header). Validate token server-side; update only `completedAt` (and optionally `updatedAt`). |
| **Enumeration** | Avoid leaking whether a plan exists; return same “not found” for invalid and expired tokens. |
| **Rate limiting** | Consider rate limiting public status-update endpoint to prevent abuse. |

### 4. Implementation outline

- **Create share link (owner):** In plan detail (or task), add “Share by link” or “Get public link”. Server action generates a token, stores `PlanShare` (or similar) with `planId`, `token`, optional `expiresAt`, and returns the public URL (e.g. `https://<app>/share/<token>`). Show “Copy link” and optionally “Email invite” (see existing invite flow if any).
- **Public view page:** Route `src/app/share/[token]/page.tsx` (or `/p/[token]`). Server: look up token → plan (and tasks). If not found or expired, notFound(). Render read-only view (plan name, goal, task list with titles and status only; no edit). For each task, if “allow status update”, show a button “Mark done” / “Restore” that calls a server action with the token; action verifies token and updates only `completedAt`.
- **Status update action:** e.g. `updateTaskStatusByShareToken(token, taskId, completedAt)`: validate token, load plan/task, ensure task belongs to plan, update task’s `completedAt`, revalidate. No auth session required; token is the auth.

### 5. Optional: email and sign-up

- “Add your email”: form on public page that posts to an action with token + email; store in a table (e.g. ShareSubscriber) for “notify when plan updates” or just for analytics. Optional.
- “Sign up”: link to normal sign-up/sign-in; after sign-in, optional “Add this plan to my plans” (clone or add as shared plan) — larger scope, can be later phase.

### 6. i18n and documentation

- All public page copy (headings, “Mark done”, “Link expired”, etc.) must be translated (en, fr, pidgin). Consider detecting locale from cookie or Accept-Language for public pages.
- Document in README and AI_PROJECT_CONTEXT: public share flow, token storage, and that only explicitly shared plans/tasks are exposed. Add a changeset when implemented.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add PlanShare (or similar) model with planId, token, expiresAt; migration |
| 2 | Add “Share by link” UI for owner; generate token and store; show copyable URL |
| 3 | Add public route /share/[token]; resolve token → plan + tasks; read-only view |
| 4 | Add server action to update task status by token; validate token, update only completedAt |
| 5 | Add “Mark done” / “Restore” on public page when token allows; secure and rate-limit |
| 6 | i18n for public page; document share flow and security; add changeset |
