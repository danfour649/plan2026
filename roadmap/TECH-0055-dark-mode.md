# TECH-0055: Dark mode

**Status:** Implemented.

**Goal:** Add a dark mode in settings so users can spare their eyes when the app is used in the dark.

**Why deferred:** Deferred in bulk run; scope is medium (theme toggle, CSS variables, persistence, i18n). **Estimated effort:** small–medium — settings option, cookie/localStorage, Tailwind dark: classes or CSS vars, ensure all pages/components respect theme.

---

## What is needed

### 1. Current behaviour

- App uses light-only styling (white/blue-50 backgrounds, zinc text). No theme preference is stored.

### 2. Scope

| Area | Options | Notes |
|------|---------|------|
| **Toggle** | Settings page: "Dark mode" toggle or "Theme: Light / Dark / System". | System follows `prefers-color-scheme`; Light/Dark override. |
| **Persistence** | Cookie (e.g. `PLAN2026_THEME`) or localStorage. | Cookie allows server-rendered correct class on `<html>`. |
| **Styling** | Tailwind `dark:` variants; or CSS variables (e.g. `--bg-page`, `--text-primary`) swapped per theme. | Tailwind: add `dark` class to root; use `dark:bg-zinc-900` etc. |
| **Coverage** | Nav, main, cards, forms, dialogs, buttons. | Audit all high-contrast surfaces; ensure focus rings and borders work in dark. |

**Recommendation:** Add a theme cookie (e.g. `light` | `dark` | `system`). In root layout, read cookie and set `class="dark"` on `<html>` when effective theme is dark. Use Tailwind `dark:` variants across the app. Add a theme control in Settings with i18n (en, fr, pidgin).

### 3. Implementation notes

- **Settings:** New section "Appearance" or under existing settings. Options: Light, Dark, System (default). On change, set cookie and optionally reload or use a client script to toggle `document.documentElement.classList.add/remove('dark')`.
- **Tailwind:** Ensure `darkMode: 'class'` in `tailwind.config`. Add `dark:` variants for header, main background, cards, form inputs, buttons, and dialogs.
- **i18n:** e.g. `settings.theme`, `settings.themeLight`, `settings.themeDark`, `settings.themeSystem`.

### 4. Summary checklist

| Step | Description |
|------|-------------|
| 1 | Add theme cookie and root layout logic to set `dark` class |
| 2 | Add theme control to Settings page with i18n (en, fr, pidgin) |
| 3 | Add Tailwind `dark:` variants for header, main, cards, forms, dialogs |
| 4 | Test light/dark/system on desktop and mobile |
