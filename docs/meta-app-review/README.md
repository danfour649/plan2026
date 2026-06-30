# Meta App Review — supporting documentation (documents-web-1)

Use this folder when submitting **Facebook Login** App Review for Plan 2026.

## What to upload in Meta Developer Console

In **App Review → Permissions and Features** (for `public_profile` and `email`), under **documents-web-1 — Supporting documentation**:

| File | Purpose |
|------|---------|
| **Screencast** (`.mp4` / `.mov`) | Required — follow [screencast-script.txt](./screencast-script.txt) |
| [01-login-page-with-facebook.png](./01-login-page-with-facebook.png) | Login page showing **Continue with Facebook** |
| [plan2026-meta-app-review.zip](./plan2026-meta-app-review.zip) | Optional zip of text instructions + screenshot |

## Copy-paste fields in the submission form

- **Use case / description:** [use-case-description.txt](./use-case-description.txt)
- **Test instructions for reviewers:** [reviewer-instructions.txt](./reviewer-instructions.txt)

## Production checklist (done)

- [x] `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` in Vercel Production
- [x] `AUTH_FACEBOOK_ENABLED=true` in Vercel Production
- [x] Production redeployed — button visible at https://plan2026.ca/login
- [ ] Meta app: Valid OAuth Redirect URI `https://plan2026.ca/api/auth/callback/facebook`
- [ ] Business verification complete (if required)
- [ ] Submit App Review for `public_profile` + `email` (Advanced Access)
- [ ] After approval: switch Meta app from **Development** to **Live**

Full checklist: [GO-LIVE-FACEBOOK.md](../../GO-LIVE-FACEBOOK.md)

## Record the screencast

Windows: **Win + G** (Xbox Game Bar) → Record, or **Snipping Tool → Record**.

Use a Facebook account that can sign in to the app (Developer/Administrator on the Meta app while in Development mode, or any account after Live mode).
