/** Production origin used for sitemap, robots, and canonical metadata. */
export const CANONICAL_ORIGIN = "https://plan2026.ca";

/** Hostname only (no protocol). */
export const CANONICAL_HOST = "plan2026.ca";

/**
 * Production hosts that must 308 to {@link CANONICAL_HOST}.
 * Preview `*.vercel.app` deployments are intentionally excluded.
 */
export const NON_CANONICAL_PRODUCTION_HOSTS = [
  "www.plan2026.ca",
  "plan2026-pi.vercel.app",
] as const;

export function normalizeHostname(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(":")[0]?.trim().toLowerCase();
  return host || null;
}

/** True when this request Host should permanently redirect to the canonical origin. */
export function shouldRedirectToCanonicalHost(
  hostHeader: string | null,
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
): boolean {
  if (vercelEnv !== "production") return false;
  const host = normalizeHostname(hostHeader);
  if (!host || host === CANONICAL_HOST) return false;
  return (NON_CANONICAL_PRODUCTION_HOSTS as readonly string[]).includes(host);
}

/** Absolute URL on the canonical origin (`path` may be "" or "/"). */
export function absoluteCanonicalUrl(path: string = "/"): string {
  if (!path || path === "/") return CANONICAL_ORIGIN;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_ORIGIN}${normalized}`;
}
