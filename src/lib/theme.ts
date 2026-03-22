export const THEME_COOKIE = "PLAN2026_THEME";

export type Theme = "light" | "dark" | "system";

export const THEMES: Theme[] = ["light", "dark", "system"];

/** Parse cookie value to Theme; invalid/missing returns "system". */
export function getThemeFromCookie(value: string | undefined): Theme {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

/**
 * Attach modal portals here so content is under `.theme-root` and Tailwind `dark:` variants match
 * the cookie-driven theme (see globals.css — dark mode is `.dark *`, not `prefers-color-scheme`).
 */
export function getThemePortalContainer(): HTMLElement {
  return document.querySelector<HTMLElement>(".theme-root") ?? document.body;
}
