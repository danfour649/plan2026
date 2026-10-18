---
"plan2026": patch
---

Facebook Login: pin Graph API v26.0 for the OAuth authorization/token/userinfo endpoints (NextAuth v4's built-in provider still uses the retired v11.0) and request exactly `public_profile email`. Make the Facebook profile mapping null-safe so a missing picture or a phone-number account with no email no longer breaks sign-in. Add Meta's Data Deletion Callback (`POST /api/facebook/data-deletion`, HMAC-verified) with a localized status page at `/privacy/deletion-status`, a stable `#data-deletion` anchor on the privacy page, and clearer Facebook data-use copy in the privacy policy (en/fr/pidgin).
