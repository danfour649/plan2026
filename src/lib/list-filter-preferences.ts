/**
 * List filter visibility (completed tasks / archived plans) is stored in first-party cookies per user.
 * The server reads them on `/tasks` and `/plans`; the client updates them via `POST /api/list-prefs`
 * (not Server Actions) so Next.js does not run a post-action RSC refresh that re-ran Prisma loaders.
 */
export const TASKS_SHOW_COMPLETED_COOKIE = "plan2026_tasks_sc";
export const PLANS_SHOW_ARCHIVED_COOKIE = "plan2026_plans_sa";

/** Shared options for `cookies().set` (API route) — keep in sync with any client expectations. */
export const LIST_PREF_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

export function readTasksShowCompletedFromCookie(value: string | undefined): boolean {
  return value === "1";
}

export function readPlansShowArchivedFromCookie(value: string | undefined): boolean {
  return value === "1";
}

/** Browser-only: read raw cookie value for deduping `postListPrefs` (cookies are not httpOnly). */
export function readListPrefCookieRawFromDocument(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return undefined;
}
