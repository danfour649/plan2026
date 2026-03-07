---
"plan2026": patch
---

Security hardening: require AUTH_SECRET in production (dev uses random secret), CUID validation for task IDs, rate limiting on task API routes, CSP and security headers, generic error messages for task operations, reduced Prisma logging, and HTML sanitizer no longer allows `<u>`. Docs updated for CSRF and secret rotation.
