# TECH-0044: Facebook login (and other IdPs / email–password)

**Status:** Implemented (Facebook provider in NextAuth; login page button when env set; README and AI_PROJECT_CONTEXT updated). Email/password sign-up remains future work.

**Goal:** Explore adding Facebook (or other identity providers) for sign-up/sign-in, and assess what would be needed to allow sign-up with email and password in addition to OAuth.

**Why deferred:** Deferred in bulk run due to scope. **Estimated effort:** large — new provider(s), and email/password requires schema (password hash), registration flow, and Credentials provider.

---

## What is needed

### 1. Facebook (Meta) Login

| Aspect | Notes |
|--------|-------|
| **Provider** | NextAuth.js supports Facebook via the Facebook provider. You add it alongside Google in the auth config. |
| **Facebook Developer** | Create an app at developers.facebook.com; add “Facebook Login” product; configure Valid OAuth Redirect URIs to match your callback (e.g. `https://<domain>/api/auth/callback/facebook`). |
| **Env vars** | Typically `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` (client ID and secret from the Facebook app). |
| **Consent / permissions** | Request only the permissions you need (e.g. email, public_profile). App Review may be required for certain permissions. |

**Recommendation:** Add Facebook provider in NextAuth config; create Facebook app and set redirect URI and env vars; test sign-in. Document the new env vars and Facebook app setup in README/DEPLOY.

### 2. Other identity providers

- NextAuth supports many providers (GitHub, Apple, etc.). Same pattern: add provider to config, create app on the IdP’s developer portal, set redirect/callback URL, add env vars. Document each in the project.

### 3. Email / password sign-up

| Aspect | Notes |
|--------|-------|
| **Credentials provider** | NextAuth has a Credentials provider; you can accept email + password and validate against your own DB. |
| **Database** | You need a User (or Account) model that stores email and a hashed password. Prisma schema: e.g. `passwordHash String?` on User, or a separate table. Never store plain passwords. |
| **Registration** | A separate flow: sign-up page → validate email/password → hash password (e.g. bcrypt) → create User → then sign in (e.g. via Credentials or session). |
| **Security** | Use a strong hashing algorithm (e.g. bcrypt or argon2); consider rate limiting and optional email verification. |

**Recommendation:** Treat email/password as a separate feature: (1) extend schema with password hash; (2) add registration action and page; (3) add Credentials provider that looks up user and verifies password; (4) document and add i18n for sign-up/sign-in. This is more work than adding another OAuth provider.

### 4. Implementation order

1. **Facebook (or one IdP):** Add provider and env; test. Low risk, quick if you already have Google.
2. **Email/password:** Design schema and registration flow; implement hashing and Credentials provider; add sign-up UI and i18n.

### 5. Documentation

- Document each new provider (Facebook, etc.) and email/password in README and AI_PROJECT_CONTEXT: env vars, links to developer consoles, and any app review or verification steps.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | (Facebook) Create Facebook app; set redirect URI; add Facebook provider and env vars; test |
| 2 | (Email/password) Design User password storage (hash only); add migration |
| 3 | (Email/password) Implement registration page and server action; hash passwords |
| 4 | (Email/password) Add Credentials provider and sign-in path; i18n for sign-up/sign-in |
| 5 | Update README and deployment docs with new providers and env vars |
