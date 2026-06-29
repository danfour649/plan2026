# Agent prompt: Split Google OAuth scopes (sign-in vs Calendar)

**Task ID:** TECH-0043 (follow-on)  
**Repo:** `plan2026`  
**Goal:** Stop requesting `calendar.events` at login. Request it only when the user explicitly connects Google Calendar. This removes Google’s “unverified app / sensitive scope” warning on normal sign-in while verification is still pending.

---

## Background

Plan 2026 uses NextAuth with a Google provider. Today **every** sign-in asks for Calendar permission because `GOOGLE_AUTHORIZATION_PARAMS` in `src/lib/google-oauth.ts` includes `https://www.googleapis.com/auth/calendar.events` alongside `openid`, `email`, and `profile`.

That param object is used in:

- `src/auth.ts` — `GoogleProvider` default `authorization.params`
- `src/app/login/GoogleSignInButton.tsx` — client `signIn("google", …)`
- `src/components/ReconnectGoogleCalendarButton.tsx` — client `signIn("google", …)`

Calendar API usage is in `src/app/api/tasks/[id]/calendar/route.ts`, which already checks `hasGoogleCalendarScope(account.scope)` and returns 403 if missing.

Settings UI (`src/app/(app)/settings/page.tsx`) currently treats “calendar connected” as `Boolean(account?.refresh_token || account?.access_token)` — that will be **wrong** after this change, because basic sign-in still stores tokens without the calendar scope.

Login copy (`t.login.calendarNotice` in `src/lib/i18n.ts`) says sign-in requests calendar access — update after the behavior change.

---

## Requirements

### 1. Split scope constants in `src/lib/google-oauth.ts`

Create two authorization param objects:

| Constant | Scopes | When used |
|----------|--------|-----------|
| `GOOGLE_SIGN_IN_PARAMS` | `openid`, `email`, `profile` only | Login, default NextAuth Google provider |
| `GOOGLE_CALENDAR_PARAMS` | `openid`, `email`, `profile`, `calendar.events` | Reconnect Calendar, Add to Calendar when scope missing |

Guidelines:

- Keep `access_type: "offline"` and `include_granted_scopes: "true"` on **both** (incremental auth).
- **Sign-in:** do **not** force `prompt: "consent"` on every login (remove it or use `prompt: "select_account"` only if needed). Existing refresh-token preservation in `src/auth.ts` `signIn` event should keep working.
- **Calendar connect:** keep `prompt: "consent"` so Google returns a refresh token when adding the sensitive scope.
- Keep `hasGoogleCalendarScope()` and `GOOGLE_CALENDAR_SCOPE` as-is.
- Deprecate or remove the old monolithic `GOOGLE_AUTHORIZATION_PARAMS` / `GOOGLE_AUTH_SCOPES` if nothing should import them anymore.

### 2. Wire sign-in to basic scopes only

- `src/auth.ts` → `GoogleProvider` uses `GOOGLE_SIGN_IN_PARAMS`.
- `src/app/login/GoogleSignInButton.tsx` → `signIn("google", { callbackUrl }, GOOGLE_SIGN_IN_PARAMS)`.

### 3. Wire calendar connect to calendar scopes

- `src/components/ReconnectGoogleCalendarButton.tsx` → `GOOGLE_CALENDAR_PARAMS`.

### 4. Add to Calendar: request scope when missing

`src/components/AddToCalendarButton.tsx` currently POSTs to `/api/tasks/[id]/calendar` and shows a toast on 403.

When the API returns 403 because calendar scope is missing (match existing error text or add a stable `code` field in the JSON response if cleaner):

- Start Google OAuth with `GOOGLE_CALENDAR_PARAMS` via `signIn("google", { callbackUrl: <current page> }, GOOGLE_CALENDAR_PARAMS)`.
- Do **not** make the user go to Settings first.

Prefer a small, focused change — e.g. detect missing-scope 403 in the button handler and call `signIn`, or add a shared helper like `connectGoogleCalendar(callbackUrl)`.

### 5. Fix Settings “connected” detection

In `src/app/(app)/settings/page.tsx`:

- Select `scope` from the Google `account` row.
- `isCalendarConnected` = `hasGoogleCalendarScope(account?.scope)` (not merely “has tokens”).
- Users signed in without calendar scope should see **disconnected** + **Reconnect Google Calendar**.

### 6. Update user-facing copy (all locales in `src/lib/i18n.ts`)

- Login `calendarNotice`: clarify that Calendar is **optional** and requested only when they use Add to Calendar or connect in Settings — not at initial sign-in.
- Adjust any settings/calendar strings that imply sign-in always grants Calendar.
- Keep EN / FR / Nigerian Pidgin in sync.

### 7. Docs (minimal)

Update `GO-LIVE.md` (and `roadmap/TECH-0043-google-oauth-live.md` if appropriate) to note:

- Basic sign-in scopes no longer trigger the sensitive-scope warning.
- `calendar.events` is requested incrementally; Calendar still needs Google verification or test-user mode when that feature is used.

---

## Out of scope

- Do **not** submit Google OAuth verification.
- Do **not** change Vercel env vars or Google Cloud Console settings.
- Do **not** run full-repo `pnpm run typecheck` / `pnpm run lint` while iterating; use `read_lints` on edited files, then scoped ESLint at the end per `.cursor/rules/defer-full-typecheck-eslint.mdc`.
- Do **not** commit unless explicitly asked. If opening a PR, use the `create-pr` skill.

---

## Acceptance criteria

1. **Login flow:** “Continue with Google” requests only `openid`, `email`, `profile` (verify in Google consent screen or OAuth debugger).
2. **Signed-in user without calendar:** lands on `/tasks`; Settings shows Calendar **disconnected**.
3. **Reconnect / Add to Calendar:** triggers a second consent including `calendar.events`; after approval, Settings shows **connected** and Add to Calendar works.
4. **Existing calendar users:** after sign-in, `include_granted_scopes` should preserve calendar access if already granted (no regression).
5. **Disconnect** in Settings still works (`src/lib/actions/settings.ts`).
6. No stale imports of `GOOGLE_AUTHORIZATION_PARAMS`.
7. i18n updated in all three locales.

---

## Files likely touched

```
src/lib/google-oauth.ts
src/auth.ts
src/app/login/GoogleSignInButton.tsx
src/components/ReconnectGoogleCalendarButton.tsx
src/components/AddToCalendarButton.tsx
src/app/(app)/settings/page.tsx
src/app/api/tasks/[id]/calendar/route.ts   (optional: stable error code for missing scope)
src/lib/i18n.ts
GO-LIVE.md
roadmap/TECH-0043-google-oauth-live.md     (optional)
```

---

## Test plan

Manual:

1. Sign out → sign in with Google → confirm no Calendar scope on consent screen.
2. Open Settings → Calendar disconnected → Reconnect → grant Calendar → connected.
3. Create task with due date → Add to Calendar → event created.
4. Sign out → sign in again (no forced consent) → Calendar still connected if scope preserved.
5. Disconnect Calendar in Settings → Add to Calendar prompts reconnect flow.

Optional unit test for `hasGoogleCalendarScope` / new param exports in `src/lib/google-oauth.ts` if quick to add.

---

## Implementation notes

- NextAuth `signIn` third argument merges into the authorization URL; client buttons can override server provider defaults.
- `src/auth.ts` already preserves `refresh_token` when Google omits it on later logins — preserve that behavior.
- Calendar route already handles insufficient-scope errors from Google API; focus on the pre-check `hasGoogleCalendarScope` path for UX.
