# TECH-0056: Add Facebook login and email/password sign-up

**Status:** Not implemented — implementation notes for future work.

**Goal:** Explore using Facebook or other identity providers for sign up / sign in (like the existing Google login). Additionally, document what would be needed to allow signup with email/password.

**Why deferred:** Deferred in bulk run; scope is large (new OAuth provider(s), possible email/password auth, schema and security). **Estimated effort:** large — OAuth config, consent screens, optional email/password with credentials table and secure hashing.

---

## What is needed

### 1. Current behaviour

- Sign-in is Google OAuth only (NextAuth). No email/password or other providers.

### 2. Facebook login

| Area | Notes |
|------|--------|
| **Provider** | Add NextAuth Facebook provider; create app at developers.facebook.com; set redirect URI and client ID/secret in env. |
| **Consent** | Same pattern as Google: user clicks "Sign in with Facebook", redirects to Facebook, returns with token. |
| **Account linking** | Decide whether same user can link both Google and Facebook (e.g. same email) or treat as separate accounts. |

**Recommendation:** Add Facebook provider in NextAuth config; add "Sign in with Facebook" button on login page; use same session and user model (e.g. match by email or create separate account per provider). i18n for new button label (en, fr, pidgin).

### 3. Email/password sign-up

| Area | Notes |
|------|--------|
| **Schema** | New table or fields for credentials: hashed password (e.g. bcrypt/argon2), email (unique), possibly email_verified. |
| **Flow** | Register page (email + password); login page "Sign in with email"; password reset flow (token or link). |
| **Security** | Hash passwords with bcrypt or argon2; rate-limit login attempts; consider CSRF and session handling. |

**Recommendation:** Document as a separate follow-up task. Implementation would include: Prisma schema for `Credential` or `Account` with hashed password; NextAuth Credentials provider; register and "forgot password" flows; email sending (e.g. Resend) for verification and reset. Scope is large; create TECH-0057 or similar when prioritised.

### 4. Summary checklist

| Step | Description |
|------|-------------|
| 1 | (Facebook) Add NextAuth Facebook provider and env vars |
| 2 | (Facebook) Add "Sign in with Facebook" on login page; i18n |
| 3 | (Email/password) Document schema and flow in this doc or TECH-0057; implement when prioritised |
