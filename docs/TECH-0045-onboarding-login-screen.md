# TECH-0045: Onboarding / login screen

**Status:** Not implemented — implementation notes for future work.

**Goal:** Improve the onboarding experience for new users and the login screen. Use as inspiration the comparison article (e.g. “I asked Gemini, Claude and ChatGPT to create a website…” style) to inform layout, copy, and first-run experience.

**Why deferred:** Deferred in bulk run due to run scope. **Estimated effort:** small–medium — login page copy/layout and optional welcome modal; i18n for new strings.

---

## What is needed

### 1. Current behaviour

- Login page shows the app logo, “Sign in with Google”, and likely minimal copy. New users may land here or be redirected here when unauthenticated. There is no dedicated “onboarding” flow after first sign-in.

### 2. Scope options

| Area | Options | Notes |
|------|---------|-------|
| **Login page** | Clear value proposition, short bullet points, better visual hierarchy, optional illustration or screenshot. | Improves first impression; can reuse i18n. |
| **First-time post-login** | One-time “Welcome” modal or short guided tour (e.g. “Create a plan”, “Add a task”). | Reduces drop-off; can be dismissed and “Don’t show again”. |
| **Empty state** | When user has no plans/tasks, show a friendly empty state with primary CTA (e.g. “Create your first plan”) instead of a bare list. | Already partially present; can be refined. |

**Recommendation:** Start with **login page improvements**: add a short value proposition (1–2 sentences), 2–3 bullet points (e.g. “Plans and tasks in one place”, “Share with others”, “Works in your language”), and improve layout/typography. Optionally add a first-time welcome modal or banner after first sign-in that links to “Create a plan” or “Add a task”.

### 3. Inspiration (referenced article)

- The referenced XDA/“I asked Gemini, Claude…” style often emphasises: clear headline, simple steps, and a single primary CTA. Apply similar principles: one clear headline, brief benefits, one prominent “Sign in with Google” (or primary action), and minimal clutter.

### 4. Implementation notes

- **Login page:** `src/app/login/page.tsx`. Add a short heading (e.g. “Plan 2026 – Plans and tasks, shared”) and a small list of benefits; ensure layout works on mobile. All copy must be in i18n (en, fr, pidgin).
- **Welcome modal:** Optional client component that checks (e.g. cookie or user metadata “firstLogin”) and shows once; set cookie or flag when dismissed so it doesn’t show again.
- **Empty state:** Verify plans and tasks pages have clear empty-state copy and CTA; refine if needed.

### 5. i18n

- New strings: e.g. `login.headline`, `login.benefit1`, `login.benefit2`, `login.benefit3`, and optional `onboarding.welcomeTitle`, `onboarding.welcomeBody`, `onboarding.cta`. Add for en, fr, pidgin.

### 6. Documentation

- Update **AI_PROJECT_CONTEXT.md** if you document the login or onboarding flow. Add a changeset when the feature is implemented.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add value proposition and benefit bullets to login page; improve layout |
| 2 | Add i18n for all new login/onboarding copy (en, fr, pidgin) |
| 3 | (Optional) Add first-time welcome modal or banner with “Don’t show again” |
| 4 | Review empty states on plans and tasks pages; add or refine CTAs |
| 5 | Test on mobile and desktop; ensure accessibility |
