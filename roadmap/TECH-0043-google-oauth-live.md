# TECH-0043: Google OAuth live (production)

**Status:** In progress — privacy page and login disclosures added in app; OAuth scopes split so sign-in uses basic profile scopes only and `calendar.events` is requested incrementally; production Google Cloud + Vercel config and verification still required. See **[GO-LIVE.md](../GO-LIVE.md)**.

**Goal:** Enable and verify Google OAuth in a production (live) environment so users can sign in with Google on the real deployment (e.g. permanent domain or production Vercel URL).

**Why deferred:** Deferred in bulk run (config/deploy work, not code-heavy). **Estimated effort:** medium — Google Cloud Console + production env vars and verification; no app code change if dev OAuth already works.

---

## What is needed

### 1. Prerequisites

- **Production URL** must be known and stable (see [TECH-0026-permanent-website.md](./TECH-0026-permanent-website.md) if moving to a custom domain).
- **NextAuth** is already configured for Google provider; this task is about production configuration and verification, not adding the provider from scratch.

### 2. Google Cloud Console configuration

| Step | Description |
|------|-------------|
| **OAuth client** | In Google Cloud Console → APIs & Services → Credentials, use an “OAuth 2.0 Client ID” (Web application). |
| **Authorized redirect URIs** | Add the production callback URL, e.g. `https://<production-domain>/api/auth/callback/google`. Must match exactly (no trailing slash). |
| **Authorized JavaScript origins** | Add the production origin, e.g. `https://<production-domain>`. |
| **Consent screen** | Ensure OAuth consent screen is configured (e.g. app name, support email). For “External” user type, verification may be required for broad access. Sign-in requests `openid`, `email`, and `profile` only; `calendar.events` is requested incrementally when the user connects Google Calendar or uses Add to Calendar (still a sensitive scope requiring verification for production). |

### 3. Environment variables (production)

- **`AUTH_GOOGLE_ID`** and **`AUTH_GOOGLE_SECRET`**: Use the Client ID and Client Secret from the same OAuth client that has the production redirect/origins. Do not use development credentials in production unless they include the production URL.
- **`NEXTAUTH_URL`**: Must be the production URL (`https://plan2026.ca`). Set in Vercel (or your host) Environment Variables for the production environment.
- **`AUTH_SECRET`**: Must be set in production (NextAuth requirement). Generate a strong random value and store it securely.

### 4. Verification steps

| Step | Description |
|------|-------------|
| 1 | Deploy the app with production env vars (NEXTAUTH_URL, AUTH_GOOGLE_*, AUTH_SECRET). |
| 2 | Open the production site and click “Sign in with Google”. |
| 3 | Complete the Google OAuth flow; confirm redirect back to the app and session creation. |
| 4 | Check for errors in server logs (e.g. Vercel logs) if sign-in fails; common causes: wrong redirect URI, NEXTAUTH_URL mismatch, or missing AUTH_SECRET. |

### 5. Common issues

- **Redirect URI mismatch:** Google shows an error if the redirect_uri in the request does not exactly match one of the Authorized redirect URIs (including protocol and path).
- **NEXTAUTH_URL:** NextAuth uses this for redirects and callbacks; it must match the URL the user is visiting (e.g. no mixing http/https or domain vs www).
- **Multiple environments:** Use separate OAuth clients for dev and prod (different redirect URIs), or one client with both dev and prod URIs listed.

### 6. Documentation

- Update **README.md**, **AI_PROJECT_CONTEXT.md**, and any **DEPLOY.md** or runbook with: production URL, required env vars, and link to Google Cloud Console steps. Do not commit secrets.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Create or update OAuth client in Google Cloud with production redirect URI and origin |
| 2 | Set NEXTAUTH_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET in production env |
| 3 | Deploy and test sign-in with Google on production |
| 4 | Document production URL and env requirements (no secrets) |
