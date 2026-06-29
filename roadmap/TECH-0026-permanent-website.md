# TECH-0026: Get permanent website

**Status:** Done — **https://plan2026.ca** (2026-06).

**Goal:** Switch from the default Vercel deployment URL (`plan2026-pi.vercel.app`) to a permanent custom domain.

---

## What is needed

### 1. Domain and DNS

- **Register a domain** (e.g. via a registrar or Vercel Domains) for the desired permanent address (e.g. `plan2026.ca` or a subdomain).
- **DNS access** to add verification and routing records as required by Vercel.

### 2. Vercel configuration

- In the Vercel project: **Settings → Domains** (or **Domains** in the dashboard).
- **Add the custom domain** (e.g. `plan2026.ca` and optionally `www.plan2026.ca`).
- Follow Vercel’s steps to **verify ownership** (often via TXT record or CNAME).
- Add the **A record** or **CNAME** Vercel specifies so traffic routes to Vercel (exact records are shown in the Vercel UI).
- Vercel will provision **SSL (HTTPS)** for the custom domain.

### 3. Application configuration

- **`NEXTAUTH_URL`** in production must use the new permanent URL (e.g. `https://plan2026.ca`). Update this in Vercel **Environment Variables** for the production environment.
- If the app uses **absolute URLs** (e.g. for redirects, links, or API callbacks), ensure they use the same origin or a configurable base URL.
- **Google OAuth:** In the Google Cloud Console, add the new domain to **Authorized redirect URIs** and **Authorized JavaScript origins** for the OAuth client (e.g. `https://plan2026.ca`, `https://plan2026.ca/api/auth/callback/google`).

### 4. Optional app-side improvements

- **Canonical URLs:** If the app is ever reachable at multiple hostnames, consider adding `<link rel="canonical">` so search engines and shares use the permanent domain.
- **Redirect from old URL:** If the previous `*.vercel.app` URL was shared or indexed, add a redirect (e.g. in Vercel or in the app) from the old URL to the new domain so links and bookmarks still work.

### 5. Documentation

- Update **README.md** and **AI_PROJECT_CONTEXT.md** (and any deployment docs like **DEPLOY.md**) with the production URL and any domain-related env or OAuth steps.
- Document the permanent URL in the project’s deployment or runbook so future maintainers know the live site address.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Obtain and configure DNS for the chosen domain |
| 2 | Add and verify domain in Vercel; add A/CNAME as instructed |
| 3 | Set `NEXTAUTH_URL` in Vercel to the permanent URL |
| 4 | Add permanent domain to Google OAuth redirect URIs and origins |
| 5 | (Optional) Add canonical URLs and redirect from old Vercel URL |
| 6 | Update README / DEPLOY / AI_PROJECT_CONTEXT with production URL and steps |

No code changes are strictly required if the app already uses `NEXTAUTH_URL` and relative paths; the work is primarily DNS, Vercel settings, Google OAuth config, and documentation.

---

## Recommended next steps (order of operations)

1. **Decide the domain** (e.g. `plan2026.ca` or a subdomain) and confirm you have (or can get) DNS access at your registrar or Vercel Domains.
2. **Register or transfer the domain** if needed; then in Vercel → project → **Settings → Domains**, add the domain and follow the verification steps (TXT/CNAME). Add the A or CNAME record Vercel shows so traffic routes to Vercel.
3. **Set `NEXTAUTH_URL`** in Vercel environment variables to the permanent URL (e.g. `https://plan2026.ca`) for the production environment.
4. **Update Google OAuth:** In Google Cloud Console, add the new domain to Authorized redirect URIs and Authorized JavaScript origins; remove or keep the old `*.vercel.app` URL depending on whether you will redirect it.
5. **Optional:** Add a redirect from the old Vercel URL to the new domain (Vercel supports this in Domains or via config) so existing links keep working.
6. **Document** the production URL and any domain/OAuth steps in README, AI_PROJECT_CONTEXT, and any runbook.

If anything fails (e.g. SSL, OAuth redirect), double-check the exact URL (no trailing slash), that DNS has propagated, and that `NEXTAUTH_URL` matches the domain the user is visiting.
