# TECH-0029: Mobile app (Android and iOS)

**Status:** On hold — scope too large for now. Do not implement until directed.

**Goal:** Create Android and iOS apps for Plan 2026 that use the existing web app (same site, not a full native rewrite).

---

## What is needed

### 1. Choose an approach

Options that “use the existing site”:

| Approach | Pros | Cons |
|----------|------|------|
| **PWA (Progressive Web App)** | No app store required; reuse current codebase; installable from browser. | Limited native APIs; distribution and discovery differ from stores. |
| **Capacitor** | Wraps the existing Next.js app in a native WebView; one codebase; access to native plugins. | OAuth and deep linking need care; WebView performance and behavior. |
| **Expo (React Native)** | True native UI; good for a separate mobile UX. | Separate codebase; would consume existing API rather than “using the existing site” directly. |

**Recommendation for “use the existing site”:** Start with **PWA** for installability and minimal new surface area, or **Capacitor** if you need app-store distribution and native capabilities (e.g. push, file system) while still serving the current Next.js app.

### 2. PWA path (if chosen)

- Add a **web app manifest** (`manifest.json` or equivalent) with name, icons, `display: standalone`, and start URL.
- Register a **service worker** (e.g. Next.js PWA plugin or custom worker) for offline/caching if desired.
- Ensure **icons** in multiple sizes for “Add to Home Screen” and splash.
- Test **install prompt** and behavior on iOS (Safari) and Android (Chrome).
- Document in README how users can install the PWA from the browser.

### 3. Capacitor path (if chosen)

- **New package/repo or subfolder:** Capacitor is typically added to the app (e.g. `npm install @capacitor/core @capacitor/cli`, then `npx cap init`). Decide whether to keep iOS/Android projects in this repo or a separate one.
- **Build:** Next.js is usually built as a static export or deployed; Capacitor often points at a **production URL** of the existing site (so the app is a WebView shell that loads the live or staged site). Alternatively, use a static export and serve it from the app bundle (more complex with SSR/auth).
- **Auth (NextAuth + Google):** In-app OAuth is tricky in WebViews. Options:
  - **In-app browser / Chrome Custom Tabs / SFSafariViewController:** Open the login URL in a browser tab that can complete Google OAuth, then redirect back to the app (via **deep link** or custom URL scheme) with session cookie or token.
  - **Capacitor Browser plugin:** Open auth in system browser and use App URL (deep link) as redirect URI; after login, user returns to app and the app loads the site (with session) in the WebView.
- **Deep linking:** Configure **Android App Links** and **iOS Universal Links** so that:
  - The OAuth redirect (or post-login redirect) opens the app instead of the browser.
  - Any shared links (e.g. `/plans/[id]`) can open in the app when installed.
- **Environment:** The app must load the site at a URL that has the same **NEXTAUTH_URL** (or equivalent) and cookie domain behavior, or use a token-based flow if you introduce one. Cookie-based sessions in WebView often require careful domain/cookie handling.

### 4. App store distribution (if targeting stores)

- **Apple (iOS):** Apple Developer account, App Store Connect, privacy policy URL, app signing and provisioning, and compliance with App Store guidelines (e.g. login, data handling).
- **Google (Android):** Google Play Developer account, store listing, privacy policy, and target SDK/API level requirements.
- **Shared:** Privacy policy and, if applicable, terms of use; data handling (tasks, plans, Google sign-in) should be described.

### 5. UX and compatibility

- **Mobile UI:** Rely on existing responsive layout and any mobile-specific fixes (e.g. TECH-0020, TECH-0021) so the same site works well inside the app.
- **Touch and performance:** Adequate touch targets and smooth scrolling; avoid desktop-only interactions in key flows (add task, edit plan, sign-in).
- **Offline:** If the app is a WebView loading the live site, offline support is limited unless you add a service worker and/or offline strategy to the web app.

### 6. Documentation and repo

- **README / AI_PROJECT_CONTEXT:** Describe that the same codebase (or same deployed site) is used by the mobile app (PWA or Capacitor), and link to any separate mobile repo or build steps.
- **Build and run:** Document how to open and run the Capacitor project (e.g. `npx cap open ios`) and any env or URL configuration the app expects.

---

## Summary checklist

| Step | Description |
|------|-------------|
| 1 | Choose approach: PWA vs Capacitor (vs separate native app). |
| 2 | PWA: manifest, icons, service worker, install flow; document install steps. |
| 3 | Capacitor: add Capacitor, configure WebView to load site or static build; implement auth + deep linking. |
| 4 | Configure Android App Links and iOS Universal Links for auth and content. |
| 5 | If targeting stores: developer accounts, store listings, privacy policy, signing. |
| 6 | Verify mobile UX (touch, layout) and document mobile app in project docs. |

Implementing TECH-0020 and TECH-0021 (mobile form and UI fixes) will improve the experience for both the responsive site and any future mobile app that reuses it.

---

## Recommended next steps (order of operations)

1. **Choose approach:** **PWA** if you want installability with no app-store process and minimal new surface (manifest + service worker + icons). **Capacitor** if you need store distribution or native APIs while still loading the existing Next.js site in a WebView.
2. **PWA path:** Add a web app manifest (name, icons, `display: standalone`, start URL), ensure icons in required sizes, optionally add a service worker (e.g. Next.js PWA plugin). Test “Add to Home Screen” on iOS (Safari) and Android (Chrome). Document in README how to install.
3. **Capacitor path:** Add Capacitor to the repo (`npm install @capacitor/core @capacitor/cli`, `npx cap init`). Configure the app to load the **production URL** of the deployed site (simplest) or a static export (harder with auth). Implement auth: use an in-app browser or system browser for Google sign-in and **deep links** (Android App Links / iOS Universal Links) so the OAuth redirect opens the app and the WebView can use the session. Test sign-in and navigation to plans/tasks.
4. **Stores (if applicable):** Create developer accounts (Apple, Google); add privacy policy and store listings; configure signing and provisioning. PWA does not require this step.
5. **Document** in README and AI_PROJECT_CONTEXT how the mobile app is built (PWA vs Capacitor), how to run it locally (e.g. `npx cap open ios`), and any env or URL configuration it expects.

If OAuth fails in the app, the usual cause is redirect URI or cookie domain: the redirect URI must point to the app’s deep link, and the WebView must load a URL that matches the cookie domain (e.g. the same production origin).
