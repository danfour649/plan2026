# Resources — TODO

Operational notes, testing checklists, and follow-ups that do not belong in roadmap analysis docs.

---

## Auth — Settings account linking (Google + Facebook)

**Added:** 2026-06-30  
**Context:** PR #107 — link Google or Facebook from `/settings` while signed in. Same OAuth callback URLs as login (`/api/auth/callback/google`, `/api/auth/callback/facebook`). No `/settings` entry in Meta or Google consoles.

### Intended flow (same email on Gmail and Facebook)

This is the normal case, not an edge case:

1. Sign in with the provider you used first (e.g. Google).
2. Open **Settings → Sign-in methods → Link Facebook account** (or Link Google).
3. Complete OAuth consent; land back on `/settings` with the provider **Connected**.
4. Sign out; sign in with **either** provider → same user, same tasks.

Cold sign-in with the second provider on `/login` when the email already exists on another method → `OAuthAccountNotLinked` (by design). Use Settings to link instead.

### When Gmail and Facebook share one email — how to test

| Goal | Approach |
|------|----------|
| Test **linking** (happy path) | Sign in with Google → Settings → Link Facebook. Same email is expected to work. |
| Test **Facebook login alone** | Use a **Meta test user** with a different email (App roles → Test users), or remove duplicate Facebook-only `User` / `Account` rows from the DB first. |
| Test **Google login alone** | Use a second Google account, or remove the Facebook `Account` row for that user in the DB. |
| Local dev without real Google | `pnpm exec tsx -r dotenv/config scripts/seed-dev-session.ts` → set `next-auth.session-token` cookie → `/settings` → link a provider. |

### Common failures (Facebook configured but linking still fails)

- **Duplicate users:** Facebook was used on `/login` before linking, creating a separate `User` for the same person. Linking then fails: account already associated with another user. Fix: delete the orphan Facebook-only user (and `Account` rows) in the DB, then link again from Settings.
- **Session lost during OAuth:** Cookie blocked or private browsing → callback treats flow as cold sign-in → `OAuthAccountNotLinked`. Use a normal browser tab; allow cookies for the app domain.
- **Facebook email permission:** App in Development without `email` approved, or user denied email → cold sign-in issues; linking while signed in should still work if session survives the round-trip.
- **Button appears stuck on “Linking…”:** Check DevTools → Network for `POST /api/auth/signin/facebook`. Should return `{ url: "https://www.facebook.com/..." }` and redirect. If login with Facebook on `/login` works on the same URL, OAuth config is fine.

### References

- [GO-LIVE-FACEBOOK.md](../GO-LIVE-FACEBOOK.md) — Meta redirect URIs, env vars, App Review
- [GO-LIVE.md](../GO-LIVE.md) — Google callback URI
- [scripts/seed-dev-session.ts](../scripts/seed-dev-session.ts) — local session without OAuth

### Follow-ups (optional)

- [x] Add “Testing with same email” subsection to `GO-LIVE-FACEBOOK.md` (or link here)
- [ ] Script or admin note to list duplicate `User` rows by email for auth cleanup
